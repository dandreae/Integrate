import type { Place, PlaceCategory } from "@/types";

export interface PlaceRepository {
  getPlacesByCampus(campusId: string): Promise<Place[]>;
  getPlaceById(placeId: string): Promise<Place | undefined>;
  searchPlaces(campusId: string, query: string): Promise<Place[]>;
  getPlacesByCategory(campusId: string, category: PlaceCategory): Promise<Place[]>;
}
