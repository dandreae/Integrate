import type { Campus, CampusEvent, Place } from "@/types";
import type { GeocodingProvider } from "@/services/geocoding";

/**
 * Best-effort match of a free-text event location (e.g. "Arrupe Hall
 * Multipurpose Room") against curated places, by substring containment —
 * conservative on purpose (same philosophy as services/geocoding/abbreviationMatch.ts):
 * a missed match just falls through to geocoding, but a wrong match would
 * silently mis-plot an event.
 */
function matchCuratedPlace(locationLabel: string, places: Place[]): Place | null {
  const needle = locationLabel.toLowerCase();
  return (
    places.find((place) => needle.includes(place.officialName.toLowerCase())) ??
    places.find((place) => place.localName && needle.includes(place.localName.toLowerCase())) ??
    null
  );
}

/**
 * Guarantees every event gets a plottable `coordinate`, in decreasing order
 * of trust:
 *  0. An already-set `locationId` (e.g. curated seed data) — just look up the place.
 *  1. A coordinate the source already gave us (rare, but exact).
 *  2. A curated Place whose name appears in the event's free-text location.
 *  3. A geocoded best guess from the free-text location.
 *  4. The campus centroid, clearly flagged "approximate" — better than
 *     silently dropping the event, never claiming precision we don't have.
 * Never throws — geocoding failures degrade to the next tier rather than
 * failing the whole event (matches GeocodingProvider's own "best-effort,
 * not required" contract).
 */
export async function resolveEventLocation(
  event: CampusEvent,
  places: Place[],
  campus: Campus,
  geocodingProvider: GeocodingProvider
): Promise<CampusEvent> {
  if (event.locationId) {
    const place = places.find((p) => p.id === event.locationId);
    if (place) {
      return {
        ...event,
        coordinate: event.coordinate ?? { latitude: place.latitude, longitude: place.longitude },
        locationConfidence: "exact",
      };
    }
  }

  if (event.coordinate) {
    const nearby = matchCuratedPlace(event.locationLabel ?? "", places);
    return { ...event, locationId: nearby?.id, locationConfidence: "exact" };
  }

  if (event.locationLabel) {
    const curated = matchCuratedPlace(event.locationLabel, places);
    if (curated) {
      return {
        ...event,
        locationId: curated.id,
        coordinate: { latitude: curated.latitude, longitude: curated.longitude },
        locationConfidence: "exact",
      };
    }

    try {
      const [best] = await geocodingProvider.search(event.locationLabel, {
        latitude: campus.latitude,
        longitude: campus.longitude,
      });
      if (best) {
        return {
          ...event,
          coordinate: { latitude: best.latitude, longitude: best.longitude },
          locationConfidence: "geocoded",
        };
      }
    } catch {
      // Best-effort — fall through to the campus-centroid fallback below.
    }
  }

  return {
    ...event,
    coordinate: { latitude: campus.latitude, longitude: campus.longitude },
    locationConfidence: "approximate",
  };
}

export async function resolveEventLocations(
  events: CampusEvent[],
  places: Place[],
  campus: Campus,
  geocodingProvider: GeocodingProvider
): Promise<CampusEvent[]> {
  return Promise.all(events.map((event) => resolveEventLocation(event, places, campus, geocodingProvider)));
}
