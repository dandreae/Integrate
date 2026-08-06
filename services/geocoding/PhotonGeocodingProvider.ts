import type { LatLng } from "@/types";
import { haversineDistanceMeters } from "@/features/routing/geo";
import type { GeocodeResult, GeocodingProvider } from "./GeocodingProvider";

const SEARCH_URL = "https://photon.komoot.io/api/";
const REVERSE_URL = "https://photon.komoot.io/reverse";
const REQUEST_TIMEOUT_MS = 6000;
/** Discard search matches farther than this from the search center — Photon is a global index and will happily return a same-named place on another continent. */
const MAX_SEARCH_DISTANCE_METERS = 4000;
/** Discard a reverse-geocode match if the nearest known feature is farther than this from the tapped point — better to fall back to a generic pin than mislabel it. */
const MAX_REVERSE_DISTANCE_METERS = 60;
/**
 * Photon ranks by text relevance first, proximity second — for a short,
 * common query (e.g. "Yates") the on-campus match can rank behind several
 * same-named streets/towns states away. Asking for a shallow `limit` then
 * distance-filtering throws the real match away before it's ever seen.
 * Requesting more candidates and doing our own distance sort/cap fixes it;
 * Photon's own `location_bias_scale`/`zoom` params were tried and made
 * ranking worse (ignored proximity entirely for short queries), not better.
 */
const SEARCH_CANDIDATE_LIMIT = 30;
const MAX_SEARCH_RESULTS = 8;

interface PhotonFeature {
  properties: {
    name?: string;
    osm_key?: string;
    osm_value?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function featureToResult(feature: PhotonFeature): GeocodeResult | null {
  if (feature.geometry?.type !== "Point" || !feature.properties?.name) return null;
  return {
    name: feature.properties.name,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    categoryHint: feature.properties.osm_value,
  };
}

/**
 * Builds the query string by hand rather than via `URL`/`URLSearchParams` —
 * those have had inconsistent support across React Native/Hermes versions,
 * and this codebase's own test coverage runs under Node, which would never
 * catch a Hermes-only gap. Plain string concatenation has no such risk.
 */
function buildUrl(base: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `${base}?${query}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPhotonOnce(url: string, context: string): Promise<{ features: PhotonFeature[] } | { retryable: true }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.warn(`[geocoding] Photon ${context} returned HTTP ${response.status}`);
      // 5xx/429 on the shared community server are usually transient — worth one retry.
      return response.status >= 500 || response.status === 429 ? { retryable: true } : { features: [] };
    }
    const data: PhotonResponse = await response.json();
    return { features: data.features ?? [] };
  } catch (error) {
    console.warn(`[geocoding] Photon ${context} failed:`, error instanceof Error ? error.message : error);
    return { retryable: true };
  } finally {
    clearTimeout(timeout);
  }
}

/** One retry for transient failures (network blips, a momentary 5xx/429 from the shared demo server) — mirrors the routing provider's resilience. */
async function fetchPhoton(url: string, context: string): Promise<PhotonFeature[]> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    const result = await fetchPhotonOnce(url, context);
    if ("features" in result) return result.features;
    if (attempt < 1) await delay(300);
  }
  return [];
}

/**
 * Free, no-API-key OSM-based geocoder (same "no signup friction" reasoning
 * as the Valhalla routing provider). Community-run — treat as best-effort;
 * failures here should never block the app, only fall back to curated
 * places alone (search) or a generic dropped pin (reverse).
 */
export class PhotonGeocodingProvider implements GeocodingProvider {
  readonly name = "photon";

  async search(query: string, near: LatLng): Promise<GeocodeResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const url = buildUrl(SEARCH_URL, {
      q: trimmed,
      lat: String(near.latitude),
      lon: String(near.longitude),
      limit: String(SEARCH_CANDIDATE_LIMIT),
    });

    const features = await fetchPhoton(url, `search("${trimmed}")`);
    const candidates = features
      .map(featureToResult)
      .filter((result): result is GeocodeResult => result !== null)
      .map((result) => ({ result, distance: haversineDistanceMeters(near, result) }));
    const nearby = candidates
      .filter(({ distance }) => distance <= MAX_SEARCH_DISTANCE_METERS)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_SEARCH_RESULTS)
      .map(({ result }) => result);

    // Distinguishes "genuinely no matches" from "matches existed but were
    // all too far from `near`" — the latter usually means `near` itself is
    // wrong (e.g. a bogus device location), not that the geocoder failed.
    if (candidates.length > 0 && nearby.length === 0) {
      const closest = Math.min(...candidates.map((c) => c.distance));
      console.warn(
        `[geocoding] search("${trimmed}") found ${candidates.length} match(es) but all were beyond ${MAX_SEARCH_DISTANCE_METERS}m of (${near.latitude}, ${near.longitude}) — closest was ${Math.round(closest)}m away. Is "near" correct?`
      );
    }

    return nearby;
  }

  async reverse(point: LatLng): Promise<GeocodeResult | null> {
    const url = buildUrl(REVERSE_URL, {
      lat: String(point.latitude),
      lon: String(point.longitude),
    });

    const features = await fetchPhoton(url, "reverse");
    const result = features.map(featureToResult).find((r): r is GeocodeResult => r !== null);
    if (!result) return null;
    return haversineDistanceMeters(point, result) <= MAX_REVERSE_DISTANCE_METERS ? result : null;
  }
}
