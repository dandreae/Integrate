import type { CampusEvent } from "@/types";
import { EVENTS_CONFIG } from "@/constants/events";
import { EventProviderError, type EventProvider } from "../events/EventProvider";
import { resolveEventLocations } from "../events/eventLocationResolver";
import type { GeocodingProvider } from "../geocoding";
import { readCachedEvents, readEventsCacheMeta, writeEventsCache } from "./firestore/eventsCache";
import type { CampusRepository } from "./CampusRepository";
import type { EventRepository } from "./EventRepository";
import type { PlaceRepository } from "./PlaceRepository";

/**
 * Live event repository: fetches from a real EventProvider, resolves every
 * event to a map coordinate, and caches the result in Firestore so repeat
 * loads (by this user or any other, within EVENTS_CONFIG.cache.ttlMinutes)
 * don't re-hit the external API. Failure order mirrors RealRouteRepository:
 * fresh cache -> live provider (writing back a fresh cache) -> stale cache
 * (better than nothing) -> seeded fallback repository.
 */
export class RealEventRepository implements EventRepository {
  constructor(
    private readonly provider: EventProvider,
    private readonly placeRepository: PlaceRepository,
    private readonly campusRepository: CampusRepository,
    private readonly geocodingProvider: GeocodingProvider,
    private readonly fallback: EventRepository
  ) {}

  async getEvents(campusId: string): Promise<CampusEvent[]> {
    const meta = await this.tryReadCacheMeta(campusId);
    const isFresh = Boolean(meta && Date.now() - meta.fetchedAt < EVENTS_CONFIG.cache.ttlMinutes * 60 * 1000);

    if (isFresh) {
      const cached = await this.tryReadCachedEvents(campusId);
      if (cached && cached.length > 0) return cached;
    }

    try {
      const rawEvents = await this.provider.getEvents(campusId);
      const resolved = await this.resolveLocations(campusId, rawEvents);
      await this.tryWriteCache(campusId, resolved);
      return resolved;
    } catch (liveError) {
      // eslint-disable-next-line no-console -- intentional: only signal that live event sourcing degraded.
      console.warn(
        `[events] Live provider (${this.provider.name}) failed, falling back:`,
        liveError instanceof EventProviderError ? `${liveError.reason} — ${liveError.message}` : liveError
      );
      const stale = await this.tryReadCachedEvents(campusId);
      if (stale && stale.length > 0) return stale;
      return this.fallback.getEvents(campusId);
    }
  }

  private async resolveLocations(campusId: string, events: CampusEvent[]): Promise<CampusEvent[]> {
    const campus = await this.campusRepository.getCampusById(campusId);
    if (!campus) return events;
    const places = await this.placeRepository.getPlacesByCampus(campusId);
    return resolveEventLocations(events, places, campus, this.geocodingProvider);
  }

  private async tryReadCacheMeta(campusId: string) {
    try {
      return await readEventsCacheMeta(campusId);
    } catch {
      return null;
    }
  }

  private async tryReadCachedEvents(campusId: string) {
    try {
      return await readCachedEvents(campusId);
    } catch {
      return null;
    }
  }

  private async tryWriteCache(campusId: string, events: CampusEvent[]): Promise<void> {
    try {
      await writeEventsCache(campusId, events, this.provider.name);
    } catch (error) {
      // eslint-disable-next-line no-console -- best-effort cache write; a failure here shouldn't fail the request.
      console.warn("[events] Failed to write events cache:", error);
    }
  }
}
