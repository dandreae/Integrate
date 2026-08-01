import type { Entrance, LatLng, Place, RoutePreference } from "@/types";

export interface EntranceCandidate {
  /** The point to actually route to/from. */
  point: LatLng;
  entrance: Entrance | null;
  /** False when we fell back to the place's centroid because no entrance data exists. */
  isKnownEntrance: boolean;
}

function placeCentroidCandidate(place: Place): EntranceCandidate {
  return {
    point: { latitude: place.latitude, longitude: place.longitude },
    entrance: null,
    isKnownEntrance: false,
  };
}

/**
 * Selects which entrance(s) of a place are worth requesting/evaluating
 * routes to for a given preference. Never returns an empty array — falls
 * back to the place's centroid (flagged `isKnownEntrance: false`) when no
 * entrance data exists or none qualify, so callers can still produce a route
 * and surface the resulting uncertainty rather than failing outright.
 */
export function selectCandidateEntrances(
  place: Place,
  preference: RoutePreference
): EntranceCandidate[] {
  if (place.entrances.length === 0) {
    return [placeCentroidCandidate(place)];
  }

  if (preference === "fastest") {
    return place.entrances.map((entrance) => ({
      point: { latitude: entrance.latitude, longitude: entrance.longitude },
      entrance,
      isKnownEntrance: true,
    }));
  }

  // accessible / mostAccessible: only known-accessible entrances when any exist.
  const accessible = place.entrances.filter((e) => e.isAccessible);
  if (accessible.length > 0) {
    return accessible.map((entrance) => ({
      point: { latitude: entrance.latitude, longitude: entrance.longitude },
      entrance,
      isKnownEntrance: true,
    }));
  }

  // No known-accessible entrance: fall back to all known entrances rather
  // than the bare centroid, but the scorer/repository must surface that
  // accessibility could not be verified — never silently claim accessibility.
  return place.entrances.map((entrance) => ({
    point: { latitude: entrance.latitude, longitude: entrance.longitude },
    entrance,
    isKnownEntrance: true,
  }));
}
