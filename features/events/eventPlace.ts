import type { CampusEvent, Place } from "@/types";

/**
 * Resolves an event to a Place for flows that need one (Directions, the
 * place-preview card) — a curated place when `locationId` matches one,
 * otherwise a synthetic place built from the event's already-resolved
 * coordinate (see services/events/eventLocationResolver.ts), mirroring how
 * services/geocoding/toSyntheticPlace.ts wraps a geocoded result. This is
 * what lets "Directions" work uniformly for curated and live/external
 * events alike. Returns null only if the event has no coordinate at all,
 * which shouldn't happen for anything an EventRepository has returned.
 */
export function resolveEventPlace(event: CampusEvent, places: Place[]): Place | null {
  if (event.locationId) {
    const curated = places.find((place) => place.id === event.locationId);
    if (curated) return curated;
  }
  if (!event.coordinate) return null;
  return {
    id: `event:${event.id}`,
    campusId: event.campusId,
    officialName: event.locationLabel ?? event.title,
    category: "landmark",
    description: event.locationLabel ? `Event location: ${event.locationLabel}` : "Event location",
    latitude: event.coordinate.latitude,
    longitude: event.coordinate.longitude,
    accessibilityFeatures: [],
    entrances: [],
    studentTips: [],
    openingHours: { summary: "See event details" },
    isSaved: false,
  };
}
