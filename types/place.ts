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
  entrances: Entrance[];
  studentTips: string[];
  openingHours: OpeningHours;
  imageUrl?: string;
  isSaved: boolean;
}
