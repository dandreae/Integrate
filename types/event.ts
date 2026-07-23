export type EventCategory =
  | "sports"
  | "concert"
  | "social"
  | "academic"
  | "market"
  | "meeting";

export type EventPopularity = "low" | "medium" | "high";

export interface CampusEvent {
  id: string;
  campusId: string;
  title: string;
  locationId: string;
  date: string;
  category: EventCategory;
  expectedPopularity: EventPopularity;
}
