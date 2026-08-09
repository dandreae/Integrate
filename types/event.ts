import type { LatLng } from "./construction";

export type EventCategory =
  | "sports"
  | "concert"
  | "social"
  | "academic"
  | "market"
  | "meeting"
  /** Couldn't be classified from the source data — still worth showing, just without a confident category badge. */
  | "other";

export type EventPopularity = "low" | "medium" | "high";

/** How much to trust `coordinate` — never silently claim precision we don't have. */
export type EventLocationConfidence =
  /** A curated Place match, or a coordinate given directly by the source. */
  | "exact"
  /** Resolved via free-text geocoding of the source's location label — a best guess. */
  | "geocoded"
  /** Nothing resolved; pinned to the campus centroid so it still shows up somewhere. */
  | "approximate";

export type EventSource = "seed" | "georgetown-livewhale";

export interface CampusEvent {
  id: string;
  campusId: string;
  title: string;
  description?: string;
  /** ISO 8601 timestamp (with time-of-day) the event starts. */
  startAt: string;
  /** ISO 8601 timestamp the event ends, when known. */
  endAt?: string;
  /** YYYY-MM-DD, derived from `startAt` — kept for the existing day-level date-math helpers (features/events/eventDate.ts). */
  date: string;
  category: EventCategory;
  expectedPopularity: EventPopularity;
  /** Set when this event resolves to one of our curated places. */
  locationId?: string;
  /** Free-text location as given by the source (e.g. "Arrupe Hall Multipurpose Room"), when no curated place matched. */
  locationLabel?: string;
  /** Resolved map coordinate. Always populated by the time an EventRepository returns the event. */
  coordinate?: LatLng;
  locationConfidence?: EventLocationConfidence;
  /** Link back to the official event page, when known. */
  sourceUrl?: string;
  /** Where this event came from — surfaced in the UI so a fetched event is never confused with curated demo content. */
  source: EventSource;
}
