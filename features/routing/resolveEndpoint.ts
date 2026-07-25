import type { LatLng, Place, RouteEndpoint } from "@/types";
import type { RouteOriginSelection } from "@/store/useDirectionsStore";

/**
 * Resolves a route origin selection ("my location" or a specific place) into
 * a concrete RouteEndpoint the routing engine can use. Kept here — alongside
 * the rest of the routing feature — rather than inline in a screen, so every
 * caller (quick "Directions" tap, the route planner, detail-screen handoff)
 * goes through the same resolution logic.
 */
export async function resolveRouteOrigin(
  origin: RouteOriginSelection,
  places: Place[],
  currentLocation: LatLng | null,
  requestLocation: () => Promise<LatLng | null>
): Promise<RouteEndpoint | null> {
  if (origin.type === "currentLocation") {
    const coordinate = currentLocation ?? (await requestLocation());
    return coordinate ? { label: "My Location", coordinate } : null;
  }

  const place = places.find((candidate) => candidate.id === origin.placeId);
  if (!place) return null;

  return {
    label: place.officialName,
    coordinate: { latitude: place.latitude, longitude: place.longitude },
  };
}

export function placeToDestinationEndpoint(place: Place): RouteEndpoint {
  return {
    label: place.officialName,
    coordinate: { latitude: place.latitude, longitude: place.longitude },
  };
}
