import type { ConstructionZone, Entrance, Place } from "@/types";
import { distanceToSegmentMeters, haversineDistanceMeters } from "@/features/routing/geo";

const AFFECTED_ENTRANCE_BUFFER_METERS = 60;

export interface AffectedEntrance {
  entrance: Entrance;
  placeName: string;
}

/**
 * Which entrances sit close enough to a construction zone's path/polygon to
 * plausibly be affected by it — computed from coordinates rather than
 * hand-authored per zone, so it stays correct as zones and entrances change.
 */
export function findAffectedEntrances(zone: ConstructionZone, places: Place[]): AffectedEntrance[] {
  const results: AffectedEntrance[] = [];

  for (const place of places) {
    for (const entrance of place.entrances) {
      const isNearZone = zone.coordinates.some((point, index) => {
        const next = zone.coordinates[index + 1];
        if (!next) {
          return haversineDistanceMeters(point, entrance) <= AFFECTED_ENTRANCE_BUFFER_METERS;
        }
        return distanceToSegmentMeters(entrance, point, next) <= AFFECTED_ENTRANCE_BUFFER_METERS;
      });

      if (isNearZone) {
        results.push({ entrance, placeName: place.officialName });
      }
    }
  }

  return results;
}
