import type { LatLng, Place } from "@/types";
import { distanceToSegmentMeters } from "./geo";

export interface PassedPlace {
  place: Place;
  distanceMeters: number;
}

const DEFAULT_RADIUS_METERS = 80;
const DEFAULT_LIMIT = 3;

/**
 * Which places sit close enough to a route's path to plausibly be "passed"
 * along the way — ordered by where they fall along the route (not just raw
 * distance), so "You'll pass: Red Square, the coffee cart, Student Center"
 * reads as a walking narrative rather than a jumbled nearest-first list.
 */
export function findPlacesAlongRoute(
  routeCoordinates: LatLng[],
  places: Place[],
  options?: { excludeIds?: Set<string>; limit?: number; radiusMeters?: number }
): PassedPlace[] {
  if (routeCoordinates.length < 2) return [];

  const limit = options?.limit ?? DEFAULT_LIMIT;
  const radiusMeters = options?.radiusMeters ?? DEFAULT_RADIUS_METERS;
  const excludeIds = options?.excludeIds ?? new Set<string>();

  const candidates = places
    .filter((place) => !excludeIds.has(place.id))
    .map((place) => {
      let bestDistance = Infinity;
      let bestSegmentIndex = -1;

      for (let i = 1; i < routeCoordinates.length; i++) {
        const distance = distanceToSegmentMeters(place, routeCoordinates[i - 1], routeCoordinates[i]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSegmentIndex = i;
        }
      }

      return { place, distanceMeters: bestDistance, segmentIndex: bestSegmentIndex };
    })
    .filter((candidate) => candidate.distanceMeters <= radiusMeters)
    .sort((a, b) => a.segmentIndex - b.segmentIndex || a.distanceMeters - b.distanceMeters);

  return candidates.slice(0, limit).map(({ place, distanceMeters }) => ({ place, distanceMeters }));
}
