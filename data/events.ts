import type { CampusEvent } from "@/types";
import { DEFAULT_CAMPUS_ID } from "./campuses";
import { daysFromNow, isoDatePart } from "./relativeTime";

/**
 * Curated demo events — used by MockEventRepository (default/offline mode)
 * and as RealEventRepository's last-resort fallback if the live Georgetown
 * feed and the Firestore cache are both unavailable. Dates are computed
 * relative to whenever this module loads (see data/relativeTime.ts) rather
 * than hardcoded, so this never drifts into the past and never needs
 * manual "refreshing" — the day offsets below (0, 1, 2, ...) are what
 * actually encode the demo's timeline. `coordinate`/`locationConfidence`
 * are intentionally left unset here — services/events/eventLocationResolver.ts
 * fills them in from `locationId` uniformly for seed and live events alike.
 */
function eventAt(daysOut: number, hourUtc: number): { startAt: string; date: string } {
  const startAt = daysFromNow(daysOut, hourUtc);
  return { startAt, date: isoDatePart(startAt) };
}

export const CAMPUS_EVENTS: CampusEvent[] = [
  {
    id: "welcome-fair",
    campusId: DEFAULT_CAMPUS_ID,
    title: "New Student Welcome Fair",
    description: "Meet campus orgs, grab freebies, and get your questions answered before the semester starts.",
    locationId: "red-square",
    ...eventAt(0, 16),
    category: "academic",
    expectedPopularity: "high",
    source: "seed",
  },
  {
    id: "sunset-yoga",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Sunset Yoga on Healy Lawn",
    description: "Free drop-in yoga, mats provided while they last — just show up.",
    locationId: "healy-lawn",
    ...eventAt(1, 23),
    category: "social",
    expectedPopularity: "medium",
    source: "seed",
  },
  {
    id: "club-interest-night",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Student Org Interest Night",
    description: "Drop by and learn about clubs looking for new members this semester.",
    locationId: "lauinger-library",
    ...eventAt(2, 23),
    category: "meeting",
    expectedPopularity: "medium",
    source: "seed",
  },
  {
    id: "farmers-market",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Georgetown Farmers Market",
    description: "Local produce, baked goods, and crafts from D.C.-area vendors.",
    locationId: "red-square",
    ...eventAt(3, 15),
    category: "market",
    expectedPopularity: "medium",
    source: "seed",
  },
  {
    id: "guts-town-hall",
    campusId: DEFAULT_CAMPUS_ID,
    title: "GUTS Bus Rider Town Hall",
    description: "Open Q&A on the Rosslyn/Arlington routes and schedule changes for the semester.",
    locationId: "guts-bus-loop",
    ...eventAt(4, 20),
    category: "meeting",
    expectedPopularity: "low",
    source: "seed",
  },
  {
    id: "midnight-mug-open-mic",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Midnight Mug Open Mic Night",
    description: "Student performers — music, poetry, comedy. Sign up at the door.",
    locationId: "midnight-mug",
    ...eventAt(5, 21),
    category: "social",
    expectedPopularity: "low",
    source: "seed",
  },
  {
    id: "fall-kickoff-concert",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Fall Kickoff Concert",
    description: "Live music on Red Square to kick off the semester.",
    locationId: "red-square",
    ...eventAt(11, 23),
    category: "concert",
    expectedPopularity: "high",
    source: "seed",
  },
  {
    id: "homecoming-tailgate",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Homecoming Blue & Gray Tailgate",
    description: "Food, games, and school spirit ahead of the homecoming game.",
    locationId: "healy-lawn",
    ...eventAt(26, 17),
    category: "sports",
    expectedPopularity: "high",
    source: "seed",
  },
];
