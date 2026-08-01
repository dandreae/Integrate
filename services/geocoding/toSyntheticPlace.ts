import type { Place } from "@/types";
import type { GeocodeResult } from "./GeocodingProvider";

/**
 * Wraps a geocoded (non-curated) result as a Place so it can flow through
 * the exact same selection/preview/routing UI as a curated place — the
 * routing layer already treats missing entrance/accessibility data
 * honestly (falls back to the centroid, never claims accessibility), so a
 * mostly-empty synthetic Place degrades gracefully rather than needing a
 * parallel UI. The `osm:` id prefix marks it as non-curated if that ever
 * matters later (e.g. hiding "Save" for places we don't actually track).
 */
export function toSyntheticPlace(result: GeocodeResult, campusId: string): Place {
  return {
    id: `osm:${result.latitude.toFixed(6)},${result.longitude.toFixed(6)}`,
    campusId,
    officialName: result.name,
    category: "landmark",
    description: "From map data — not yet curated in Integrate, so details may be limited.",
    latitude: result.latitude,
    longitude: result.longitude,
    accessibilityFeatures: [],
    entrances: [],
    studentTips: [],
    openingHours: { summary: "Hours not available" },
    isSaved: false,
  };
}
