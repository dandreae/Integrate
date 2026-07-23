import type { Place } from "@/types";

/**
 * One-line accessibility summary for a place, grounded in its actual entrance
 * data rather than a generic "accessible/not accessible" flag — this specific,
 * entrance-aware phrasing is the point of the feature.
 */
export function getAccessibilitySummary(place: Place): string {
  const accessibleEntrances = place.entrances.filter((entrance) => entrance.isAccessible);

  if (place.entrances.length === 0) {
    return place.accessibilityFeatures.length > 0
      ? "Open-air space with level access"
      : "No accessibility information available";
  }

  if (accessibleEntrances.length === 0) {
    return "No accessible entrance on record — stairs only";
  }

  if (accessibleEntrances.length === 1) {
    return `Accessible via "${accessibleEntrances[0].label}"`;
  }

  return `${accessibleEntrances.length} accessible entrances available`;
}
