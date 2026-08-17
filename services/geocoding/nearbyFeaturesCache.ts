import type { GeocodeResult } from "./GeocodingProvider";

// Two independent public Overpass instances, tried in order. Both are
// free/no-key and both correctly send CORS headers (verified directly,
// including on their error responses) — the mirror isn't a CORS workaround,
// it's resilience against the primary being intermittently overloaded,
// which is a real, observed failure mode of the public instance (roughly
// 1-in-3 requests to a bounding-box query like this one 504's after ~10s).
const OVERPASS_URLS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const REQUEST_TIMEOUT_MS = 15000;

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function buildQuery(bounds: MapBounds): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  return (
    `[out:json][timeout:15];` +
    `(way["building"]["name"](${bbox});way["amenity"]["name"](${bbox});` +
    `node["amenity"]["name"](${bbox});way["leisure"]["name"](${bbox}););` +
    `out tags center 150;`
  );
}

function parseElements(data: OverpassResponse): GeocodeResult[] {
  const seen = new Set<string>();
  const results: GeocodeResult[] = [];
  for (const element of data.elements) {
    const name = element.tags?.name;
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (!name || latitude == null || longitude == null || seen.has(name)) continue;
    seen.add(name);
    results.push({ name, latitude, longitude });
  }
  return results;
}

/** One attempt against one Overpass instance. Returns null (never throws) so the caller can fall through to the next mirror. */
async function tryFetch(url: string, bounds: MapBounds): Promise<GeocodeResult[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(buildQuery(bounds))}`,
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`[geocoding] Overpass nearby-features (${url}) returned HTTP ${response.status}`);
      return null;
    }
    return parseElements(await response.json());
  } catch (error) {
    console.warn(`[geocoding] Overpass nearby-features (${url}) failed:`, error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Every named building/amenity within the campus bounds, from live map
 * data — the pool the abbreviation-guessing heuristic checks queries
 * against. Fetched once per session (module-level cache keyed on bounds,
 * which don't change for a given campus) and best-effort: tries each
 * OVERPASS_URLS mirror in turn, and if every one fails, the "possible
 * abbreviation match" feature quietly has nothing to offer — it never
 * blocks or breaks normal search.
 */
let cache: { key: string; promise: Promise<GeocodeResult[]> } | null = null;

export function fetchNearbyNamedFeatures(bounds: MapBounds): Promise<GeocodeResult[]> {
  const key = [bounds.south, bounds.west, bounds.north, bounds.east].map((n) => n.toFixed(4)).join(",");
  if (cache?.key === key) return cache.promise;

  const promise = (async (): Promise<GeocodeResult[]> => {
    for (const url of OVERPASS_URLS) {
      const result = await tryFetch(url, bounds);
      if (result !== null) return result;
    }
    return [];
  })();

  cache = { key, promise };
  return promise;
}
