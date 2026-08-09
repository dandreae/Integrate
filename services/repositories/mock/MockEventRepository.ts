import { CAMPUS_EVENTS } from "@/data";
import type { CampusEvent } from "@/types";
import type { GeocodingProvider } from "@/services/geocoding";
import { resolveEventLocations } from "@/services/events/eventLocationResolver";
import type { CampusRepository } from "../CampusRepository";
import type { EventRepository } from "../EventRepository";
import type { PlaceRepository } from "../PlaceRepository";

/**
 * Offline/demo mode: curated seed data from data/events.ts. Also doubles as
 * RealEventRepository's last-resort fallback when the live Georgetown feed
 * and the Firestore cache are both unavailable — same role
 * MockRoutingProvider plays for routing.
 */
export class MockEventRepository implements EventRepository {
  constructor(
    private readonly placeRepository: PlaceRepository,
    private readonly campusRepository: CampusRepository,
    private readonly geocodingProvider: GeocodingProvider
  ) {}

  async getEvents(campusId: string): Promise<CampusEvent[]> {
    const events = CAMPUS_EVENTS.filter((event) => event.campusId === campusId);
    const campus = await this.campusRepository.getCampusById(campusId);
    if (!campus) return events;
    const places = await this.placeRepository.getPlacesByCampus(campusId);
    return resolveEventLocations(events, places, campus, this.geocodingProvider);
  }
}
