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

/**
 * Current operational status of this building's elevator(s), separate from
 * the static `accessibilityFeatures` tag — an elevator can exist but be
 * temporarily out of service.
 */
export type ElevatorStatus = "available" | "out-of-service" | "none";

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
  category: PlaceCategory;
  description: string;
  latitude: number;
  longitude: number;
  accessibilityFeatures: AccessibilityFeature[];
  /** Current elevator status for this building, when known. Undefined means unknown, not "no elevator". */
  elevatorStatus?: ElevatorStatus;
  entrances: Entrance[];
  studentTips: string[];
  openingHours: OpeningHours;
  imageUrl?: string;
  websiteUrl?: string;
  isSaved: boolean;
}
