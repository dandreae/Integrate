import type { LatLng } from "@/types";
import { haversineDistanceMeters } from "@/features/routing/geo";
import type { GeocodeResult, GeocodingProvider } from "./GeocodingProvider";

const BASE_URL = "https://photon.komoot.io/api/";
const REQUEST_TIMEOUT_MS = 6000;
/** Discard matches farther than this from the search center — Photon is a global index and will happily return a same-named place on another continent. */
const MAX_DISTANCE_METERS = 4000;

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

/**
 * Free, no-API-key OSM-based geocoder (same "no signup friction" reasoning
 * as the Valhalla routing provider). Community-run — treat as best-effort;
 * failures here should never block the app, only fall back to showing
 * curated places alone.
 */
export class PhotonGeocodingProvider implements GeocodingProvider {
  readonly name = "photon";

  async search(query: string, near: LatLng): Promise<GeocodeResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      const url = new URL(BASE_URL);
      url.searchParams.set("q", trimmed);
      url.searchParams.set("lat", String(near.latitude));
      url.searchParams.set("lon", String(near.longitude));
      url.searchParams.set("limit", "8");
      response = await fetch(url.toString(), { signal: controller.signal });
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) return [];

    let data: PhotonResponse;
    try {
      data = await response.json();
    } catch {
      return [];
    }

    return data.features
      .filter((f) => f.geometry?.type === "Point" && f.properties?.name)
      .map((f): GeocodeResult => ({
        name: f.properties.name!,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        categoryHint: f.properties.osm_value,
      }))
      .filter((result) => haversineDistanceMeters(near, result) <= MAX_DISTANCE_METERS);
  }
}
