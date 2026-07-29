import type { Place } from "@/types";
import { DEFAULT_CAMPUS_ID } from "./campuses";

/**
 * Place data for Georgetown University's main campus. Coordinates are
 * supplied by the user one at a time — being filled in incrementally.
 */
export const PLACES: Place[] = [
  {
    id: "lauinger-library",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Lauinger Memorial Library",
    localName: "Lau",
    category: "study",
    description:
      "The main university library at 37th & Prospect — six floors of study space, from silent floors to group rooms.",
    latitude: 38.90646,
    longitude: -77.07226,
    accessibilityFeatures: ["ramp", "elevator", "automatic-doors", "accessible-restroom"],
    entrances: [],
    studentTips: [],
    openingHours: { summary: "Mon–Thu 24 hours, Fri–Sun varies (posted at entrance)" },
    imageUrl: undefined,
    isSaved: false,
  },
];

export function getPlaceById(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id);
}
