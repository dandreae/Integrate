import type { Place, PlaceCategory } from "@/types";

export type LiveStatus = "busy" | "quiet" | null;

const BUSY_CATEGORIES: PlaceCategory[] = ["coffee", "dining"];
const QUIET_CATEGORIES: PlaceCategory[] = ["study"];

/**
 * A lightweight, deterministic "feels alive right now" heuristic — not a
 * real occupancy signal. Coffee/dining places read as busy during
 * lunch/dinner windows if they have curated `busyHours`; study spaces read
 * as quiet early morning or late night if they have curated `quietHours`.
 * Demo polish only — this is intentionally simple, not a sensor feed.
 */
export function getLiveStatus(
  place: Pick<Place, "category" | "busyHours" | "quietHours">,
  now: Date = new Date()
): LiveStatus {
  const hour = now.getHours();

  if (BUSY_CATEGORIES.includes(place.category) && place.busyHours) {
    const isMealRush = (hour >= 11 && hour < 14) || (hour >= 17 && hour < 19);
    if (isMealRush) return "busy";
  }

  if (QUIET_CATEGORIES.includes(place.category) && place.quietHours) {
    const isOffPeak = hour < 9 || hour >= 22;
    if (isOffPeak) return "quiet";
  }

  return null;
}

export const LIVE_STATUS_LABEL: Record<Exclude<LiveStatus, null>, string> = {
  busy: "Busy now",
  quiet: "Quiet now",
};
