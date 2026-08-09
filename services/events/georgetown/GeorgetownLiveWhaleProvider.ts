import type { CampusEvent } from "@/types";
import { EVENTS_CONFIG } from "@/constants/events";
import { categorizeEvent } from "../categorizeEvent";
import { EventProviderError, type EventProvider } from "../EventProvider";

interface RawLiveWhaleEvent {
  id: number | string;
  title: string;
  url?: string;
  date_iso?: string;
  date_utc?: string;
  is_canceled?: number | boolean;
  location?: string | null;
  location_title?: string | null;
  location_latitude?: number | string | null;
  location_longitude?: number | string | null;
  description?: string;
  summary?: string;
  tags?: string[];
  event_types?: string[];
}

interface RawLiveWhaleResponse {
  meta?: { total?: number };
  data?: RawLiveWhaleEvent[];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseStartAt(raw: RawLiveWhaleEvent): string | null {
  if (raw.date_iso) {
    const parsed = new Date(raw.date_iso);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (raw.date_utc) {
    // "YYYY-MM-DD HH:mm:ss", implied UTC.
    const parsed = new Date(`${raw.date_utc.replace(" ", "T")}Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function toCoordinate(raw: RawLiveWhaleEvent): { latitude: number; longitude: number } | undefined {
  const latitude = Number(raw.location_latitude);
  const longitude = Number(raw.location_longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)) {
    return { latitude, longitude };
  }
  return undefined;
}

function normalize(raw: RawLiveWhaleEvent, campusId: string): CampusEvent | null {
  if (raw.is_canceled) return null;
  const startAt = parseStartAt(raw);
  if (!startAt) return null;

  const tags = [...(raw.event_types ?? []), ...(raw.tags ?? [])];
  const locationLabel = raw.location || raw.location_title || undefined;

  return {
    // LiveWhale reuses the same `id` across every occurrence of a recurring
    // event — fold the start date in so each occurrence is a distinct event.
    id: `georgetown-${raw.id}-${startAt.slice(0, 10)}`,
    campusId,
    title: raw.title,
    description: raw.description || raw.summary || undefined,
    startAt,
    date: startAt.slice(0, 10),
    category: categorizeEvent(raw.title, tags),
    // Not derivable from the source at all — the honest default, matches
    // how AccessibilityReport.severity documents an undecidable default.
    expectedPopularity: "medium",
    locationLabel,
    coordinate: toCoordinate(raw),
    sourceUrl: raw.url,
    source: "georgetown-livewhale",
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches Georgetown's public events calendar (events.georgetown.edu, a
 * LiveWhale-hosted calendar with a public, no-API-key-required JSON feed —
 * see https://support.livewhale.com/live/blurbs/json-api). Only knows how
 * to fetch for EVENTS_CONFIG.georgetown.campusId; any other campus throws
 * "missing-config" rather than silently returning nothing.
 */
export class GeorgetownLiveWhaleProvider implements EventProvider {
  readonly name = "georgetown-livewhale";
  readonly isReal = true;

  async getEvents(campusId: string): Promise<CampusEvent[]> {
    if (campusId !== EVENTS_CONFIG.georgetown.campusId) {
      throw new EventProviderError(
        `No live event source configured for campus "${campusId}".`,
        "missing-config"
      );
    }

    const attempts = EVENTS_CONFIG.georgetown.retryAttempts;
    let lastError: unknown;
    for (let attempt = 0; attempt <= attempts; attempt++) {
      try {
        return await this.requestOnce(campusId);
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof EventProviderError && (error.reason === "network" || error.reason === "timeout");
        if (!retryable || attempt === attempts) break;
        await delay(300 * (attempt + 1));
      }
    }
    throw lastError;
  }

  private async requestOnce(campusId: string): Promise<CampusEvent[]> {
    const config = EVENTS_CONFIG.georgetown;
    const now = new Date();
    const startDate = toIsoDate(now);
    const endDate = toIsoDate(new Date(now.getTime() + config.lookAheadDays * 24 * 60 * 60 * 1000));
    const responseFields = [
      "location",
      "location_title",
      "location_latitude",
      "location_longitude",
      "description",
      "summary",
      "event_types",
      "tags",
    ].join(",");

    const url =
      `${config.baseUrl}/live/json/events/` +
      `start_date/${startDate}/end_date/${endDate}/` +
      `response_fields/${responseFields}/max/${config.maxResults}/`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new EventProviderError("Georgetown events request timed out.", "timeout");
      }
      throw new EventProviderError("Could not reach the Georgetown events calendar.", "network");
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new EventProviderError(`Georgetown events calendar returned ${response.status}.`, "network");
    }

    let data: RawLiveWhaleResponse;
    try {
      data = await response.json();
    } catch {
      throw new EventProviderError("Georgetown events calendar returned an unreadable response.", "unexpected");
    }

    if (!Array.isArray(data.data)) {
      throw new EventProviderError("Georgetown events calendar response was missing event data.", "invalid-response");
    }

    return data.data
      .map((raw) => normalize(raw, campusId))
      .filter((event): event is CampusEvent => event !== null);
  }
}
