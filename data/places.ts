import type { Place } from "@/types";
import { DEFAULT_CAMPUS_ID } from "./campuses";

/**
 * Place data for Georgetown University's main campus. Building identities
 * and locations were verified against Georgetown's own campus/transportation
 * pages and Wikipedia (see PR discussion), but exact lat/longs beyond the
 * verified anchors (Healy Hall, Lauinger Library) are approximate, matching
 * the precision of the rest of this dataset.
 */
export const PLACES: Place[] = [
  // ---- Academic buildings ----
  {
    id: "intercultural-center",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Intercultural Center",
    localName: "the ICC",
    category: "academic",
    description:
      "Large, maze-like academic building with lecture halls, the business school's original home, and a rooftop garden.",
    latitude: 38.9081,
    longitude: -77.0714,
    accessibilityFeatures: ["ramp", "elevator", "automatic-doors"],
    entrances: [
      {
        id: "icc-north",
        placeId: "intercultural-center",
        latitude: 38.9083,
        longitude: -77.0715,
        label: "North entrance (Reiss side)",
        isAccessible: true,
      },
      {
        id: "icc-south",
        placeId: "intercultural-center",
        latitude: 38.9079,
        longitude: -77.0713,
        label: "South entrance (Leavey side)",
        isAccessible: true,
        notes: "Busiest entrance between classes.",
      },
    ],
    studentTips: [
      "Everyone gets lost in the ICC at least once — the room numbering jumps between floors.",
      "The Galleria on the ground floor is a common shortcut to cut through when it's raining.",
    ],
    openingHours: { summary: "Mon–Fri 7am–10pm" },
    imageUrl: undefined,
    isSaved: false,
  },
  {
    id: "reiss-science",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Reiss Science Building",
    localName: "Reiss",
    category: "academic",
    description: "Chemistry and biology labs and lecture halls.",
    latitude: 38.9086,
    longitude: -77.0716,
    accessibilityFeatures: ["ramp"],
    entrances: [
      {
        id: "reiss-main",
        placeId: "reiss-science",
        latitude: 38.9087,
        longitude: -77.0716,
        label: "Main entrance",
        isAccessible: true,
      },
    ],
    studentTips: ["Basement labs run cold — bring a layer even in summer."],
    openingHours: { summary: "Mon–Fri 7am–9pm" },
    imageUrl: undefined,
    isSaved: false,
  },
  {
    id: "white-gravenor",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "White-Gravenor Hall",
    localName: "White-Grav",
    category: "academic",
    description:
      "Home to language and humanities departments, with small seminar-style classrooms.",
    latitude: 38.9082,
    longitude: -77.0729,
    accessibilityFeatures: ["ramp"],
    entrances: [
      {
        id: "white-grav-main",
        placeId: "white-gravenor",
        latitude: 38.9082,
        longitude: -77.073,
        label: "Main entrance facing Healy Lawn",
        isAccessible: true,
      },
    ],
    studentTips: [
      "Stairwells are narrow — the elevator by the main entrance is slow but reliable.",
    ],
    openingHours: { summary: "Mon–Fri 7am–9pm" },
    imageUrl: undefined,
    isSaved: false,
  },

  // ---- Dining ----
  {
    id: "chick-fil-a",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Chick-fil-A",
    category: "dining",
    description: "Campus Chick-fil-A inside Hoya Court, in the Leavey Center.",
    latitude: 38.9078,
    longitude: -77.0717,
    accessibilityFeatures: ["ramp", "elevator", "automatic-doors"],
    entrances: [
      {
        id: "chick-fil-a-main",
        placeId: "chick-fil-a",
        latitude: 38.9078,
        longitude: -77.0717,
        label: "Hoya Court, Leavey Center",
        isAccessible: true,
      },
    ],
    studentTips: ["Mobile order ahead — the Hoya Court line gets long around lunch."],
    openingHours: { summary: "Mon–Fri 10:30am–8pm" },
    imageUrl: undefined,
    isSaved: false,
  },
  {
    id: "leos-dining-hall",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Leo J. O'Donovan Dining Hall",
    localName: "Leo's",
    category: "dining",
    description:
      "The main all-you-can-eat dining hall for on-campus students, in the Southwest Quad just south of McCarthy Hall, above the Southwest parking garage.",
    latitude: 38.9069,
    longitude: -77.0733,
    accessibilityFeatures: ["ramp", "automatic-doors"],
    entrances: [
      {
        id: "leos-main",
        placeId: "leos-dining-hall",
        latitude: 38.9069,
        longitude: -77.0734,
        label: "Main entrance",
        isAccessible: true,
      },
    ],
    studentTips: [
      "Sunday brunch is the busiest single meal of the week — go before 11am to skip the line.",
      "The made-to-order pasta station has the longest wait most nights.",
    ],
    openingHours: { summary: "Daily 7am–8pm" },
    imageUrl: undefined,
    isSaved: false,
  },

  // ---- Study spaces ----
  {
    id: "lauinger-library",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Lauinger Memorial Library",
    localName: "Lau",
    category: "study",
    description:
      "The main university library at 37th & Prospect — six floors of study space, from silent floors to group rooms.",
    latitude: 38.9064,
    longitude: -77.0722,
    accessibilityFeatures: ["ramp", "elevator", "automatic-doors", "accessible-restroom"],
    entrances: [
      {
        id: "lau-main",
        placeId: "lauinger-library",
        latitude: 38.9064,
        longitude: -77.0723,
        label: "Main entrance (Red Square side)",
        isAccessible: true,
      },
    ],
    studentTips: [
      "The 2nd floor is the social/group-study floor — for quiet, head to floors 3 and up.",
      "Group study rooms can be booked online and go fast during midterms.",
    ],
    openingHours: { summary: "Mon–Thu 24 hours, Fri–Sun varies (posted at entrance)" },
    imageUrl: undefined,
    isSaved: false,
  },

  // ---- Other campus places ----
  {
    id: "georgetown-university-bookstore",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Georgetown University Bookstore",
    category: "resource",
    description:
      "Campus textbook, supplies, and Hoya gear store in the Leavey Center (3800 Reservoir Rd NW).",
    latitude: 38.9077,
    longitude: -77.0715,
    accessibilityFeatures: ["ramp", "elevator", "automatic-doors"],
    entrances: [
      {
        id: "bookstore-main",
        placeId: "georgetown-university-bookstore",
        latitude: 38.9077,
        longitude: -77.0715,
        label: "Leavey Center entrance",
        isAccessible: true,
      },
    ],
    studentTips: ["Buy/rent textbooks the first week of the semester before the best options sell out."],
    openingHours: { summary: "Mon–Fri 9am–6pm, Sat–Sun 11am–5pm" },
    imageUrl: undefined,
    isSaved: false,
  },
  {
    id: "vital-vittles",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Vital Vittles",
    localName: "Vitals",
    category: "grocery",
    description:
      "Student-run grocery store operated by The Corp, in the Leavey Center.",
    latitude: 38.9078,
    longitude: -77.0719,
    accessibilityFeatures: ["ramp", "elevator"],
    entrances: [
      {
        id: "vitals-main",
        placeId: "vital-vittles",
        latitude: 38.9078,
        longitude: -77.0719,
        label: "Leavey Center entrance",
        isAccessible: true,
      },
    ],
    studentTips: ["Good for late-night snack runs — cheaper than the convenience stores off campus."],
    openingHours: { summary: "Daily 10am–12am" },
    imageUrl: undefined,
    isSaved: false,
  },
  {
    id: "west-road-lot-y",
    campusId: DEFAULT_CAMPUS_ID,
    officialName: "Lot Y",
    localName: "the West Road lot",
    category: "parking",
    description:
      "Surface parking lot along West Road, adjacent to Yates Field House — marked with the campus's blue \"P\" parking signage.",
    latitude: 38.9095,
    longitude: -77.0746,
    accessibilityFeatures: ["accessible-parking"],
    entrances: [
      {
        id: "lot-y-main",
        placeId: "west-road-lot-y",
        latitude: 38.9095,
        longitude: -77.0746,
        label: "Lot entrance, West Road",
        isAccessible: true,
      },
    ],
    studentTips: ["Closest lot to Yates Field House and the athletic fields."],
    openingHours: { summary: "Daily 24 hours" },
    imageUrl: undefined,
    isSaved: false,
  },
];

export function getPlaceById(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id);
}
