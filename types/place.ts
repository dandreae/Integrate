import type { Entrance } from "./entrance";

export type PlaceCategory =
  | "academic"
  | "dining"
  | "coffee"
  | "study"
  | "landmark"
  | "grocery"
  | "parking"
  | "resource"
  | "gathering";

export type AccessibilityFeature =
  | "wheelchair-accessible-entrance"
  | "elevator"
  | "ramp"
  | "accessible-restroom"
  | "automatic-doors"
  | "level-access"
  | "accessible-parking";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface OpeningHours {
  /** Short human-readable summary, e.g. "Mon–Fri 7am–9pm, Sat–Sun 9am–6pm". Placeholder for MVP. */
  summary: string;
  note?: string;
}

export interface Place {
  id: string;
  campusId: string;
  officialName: string;
  localName?: string;
  /** Abbreviations/nicknames for search matching, e.g. ["ICC"] — distinct from `localName`, which is the one primary colloquial name used in prose. */
  aliases: string[];
  category: PlaceCategory;
  description: string;
  latitude: number;
  longitude: number;
  accessibilityFeatures: AccessibilityFeature[];
  entrances: Entrance[];
  /** Entrance ids ordered by how commonly used they are; the first is the recommended/"best" entrance. */
  popularEntrances: string[];
  studentTips: string[];
  /** Wayfinding-specific tips (distinct focus from general `studentTips`) — how to actually get around once you're there. */
  navigationTips: string[];
  /** Tips aimed specifically at incoming/first-year students. */
  firstYearTips: string[];
  /** Freeform accessibility context beyond the structured `accessibilityFeatures`/entrance data. */
  accessibilityNotes?: string;
  quietHours?: string;
  busyHours?: string;
  openingHours: OpeningHours;
  /** Curated "closely associated" places — prioritized in the Nearby section before computed proximity fills remaining slots. */
  nearbyPlaceIds: string[];
  /** ISO date this place's data was last confirmed accurate. */
  dataLastVerifiedAt: string;
  verificationSource: string;
  confidenceLevel: ConfidenceLevel;
  imageUrl?: string;
  isSaved: boolean;
}
