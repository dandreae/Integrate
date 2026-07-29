import type { Place } from "@/types";
import { DEFAULT_CAMPUS_ID } from "./campuses";

/**
 * Place data for Georgetown University's main campus. Empty pending exact
 * coordinates.
 */
export const PLACES: Place[] = [];

export function getPlaceById(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id);
}
