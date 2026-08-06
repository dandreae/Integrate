import type { GeocodeResult } from "./GeocodingProvider";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
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

/**
 * Every named building/amenity within the campus bounds, from live map
 * data — the pool the abbreviation-guessing heuristic checks queries
 * against. Fetched once per session (module-level cache keyed on bounds,
 * which don't change for a given campus) and best-effort: a failure here
 * just means the "possible abbreviation match" feature quietly has nothing
 * to offer, it never blocks or breaks normal search.
 */
let cache: { key: string; promise: Promise<GeocodeResult[]> } | null = null;

export function fetchNearbyNamedFeatures(bounds: MapBounds): Promise<GeocodeResult[]> {
  const key = [bounds.south, bounds.west, bounds.north, bounds.east].map((n) => n.toFixed(4)).join(",");
  if (cache?.key === key) return cache.promise;

  const promise = (async (): Promise<GeocodeResult[]> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(buildQuery(bounds))}`,
        signal: controller.signal,
      });
      if (!response.ok) {
        console.warn(`[geocoding] Overpass nearby-features returned HTTP ${response.status}`);
        return [];
      }
      const data: OverpassResponse = await response.json();
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
    } catch (error) {
      console.warn(
        "[geocoding] Overpass nearby-features failed:",
        error instanceof Error ? error.message : error
      );
      return [];
    } finally {
      clearTimeout(timeout);
    }
  })();

  cache = { key, promise };
  return promise;
}
