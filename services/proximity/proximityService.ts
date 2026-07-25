import type { Place } from "@/types";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { haversineDistanceMeters } from "@/features/routing/geo";

/**
 * PROXIMITY SERVICE
 * -----------------
 * Reusable lat/lng proximity utility for "nearby discovery." Distance math
 * itself is delegated to the routing feature's `haversineDistanceMeters`
 * (kept in one place rather than duplicated); this module adds the
 * category-diversity selection on top, so a place's "Nearby" list reads as
 * "nearby coffee / closest study space / ..." rather than four dining halls.
 */

export interface NearbyPlaceResult {
  place: Place;
  distanceMeters: number;
  reason: string;
}

interface NearbySlotDefinition {
  reason: string;
  predicate: (place: Place) => boolean;
}

const DEFAULT_LIMIT = 4;

const SLOT_DEFINITIONS: NearbySlotDefinition[] = [
  { reason: "Nearby coffee", predicate: (place) => place.category === "coffee" },
  { reason: "Closest study space", predicate: (place) => place.category === "study" },
  {
    reason: "Nearby accessible restroom",
    predicate: (place) => place.accessibilityFeatures.includes("accessible-restroom"),
  },
  { reason: "Nearby landmark", predicate: (place) => place.category === "landmark" },
];

export interface FindNearbyPlacesOptions {
  limit?: number;
  /** Curated place ids (e.g. `Place.nearbyPlaceIds`) to prioritize before diverse-category slots are filled. */
  curatedIds?: string[];
}

export function findNearbyPlaces(
  origin: Place,
  candidates: Place[],
  options?: FindNearbyPlacesOptions
): NearbyPlaceResult[] {
  const limit = options?.limit ?? DEFAULT_LIMIT;

  const sortedByDistance = candidates
    .filter((place) => place.id !== origin.id)
    .map((place) => ({
      place,
      distanceMeters: haversineDistanceMeters(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: place.latitude, longitude: place.longitude }
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const results: NearbyPlaceResult[] = [];
  const usedIds = new Set<string>();

  for (const id of options?.curatedIds ?? []) {
    if (results.length >= limit) break;
    const match = sortedByDistance.find((entry) => entry.place.id === id && !usedIds.has(id));
    if (match) {
      results.push({ ...match, reason: "Nearby" });
      usedIds.add(id);
    }
  }

  for (const slot of SLOT_DEFINITIONS) {
    if (results.length >= limit) break;
    const match = sortedByDistance.find(
      (entry) => slot.predicate(entry.place) && !usedIds.has(entry.place.id)
    );
    if (match) {
      results.push({ ...match, reason: slot.reason });
      usedIds.add(match.place.id);
    }
  }

  for (const entry of sortedByDistance) {
    if (results.length >= limit) break;
    if (usedIds.has(entry.place.id)) continue;
    results.push({ ...entry, reason: `Nearby ${PLACE_CATEGORY_META[entry.place.category].label.toLowerCase()}` });
    usedIds.add(entry.place.id);
  }

  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}
