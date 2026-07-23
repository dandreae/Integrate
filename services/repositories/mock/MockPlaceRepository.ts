import type { Place, PlaceCategory } from "@/types";
import { PLACES } from "@/data";
import type { PlaceRepository } from "../PlaceRepository";

export class MockPlaceRepository implements PlaceRepository {
  async getPlacesByCampus(campusId: string): Promise<Place[]> {
    return PLACES.filter((place) => place.campusId === campusId);
  }

  async getPlaceById(placeId: string): Promise<Place | undefined> {
    return PLACES.find((place) => place.id === placeId);
  }

  async searchPlaces(campusId: string, query: string): Promise<Place[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return this.getPlacesByCampus(campusId);

    return PLACES.filter(
      (place) =>
        place.campusId === campusId &&
        (place.officialName.toLowerCase().includes(normalized) ||
          place.localName?.toLowerCase().includes(normalized) ||
          place.description.toLowerCase().includes(normalized))
    );
  }

  async getPlacesByCategory(campusId: string, category: PlaceCategory): Promise<Place[]> {
    return PLACES.filter((place) => place.campusId === campusId && place.category === category);
  }
}
