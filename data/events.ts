import type { CampusEvent } from "@/types";
import { DEFAULT_CAMPUS_ID } from "./campuses";

/**
 * Curated demo events — used by MockEventRepository (default/offline mode)
 * and as RealEventRepository's last-resort fallback if the live Georgetown
 * feed and the Firestore cache are both unavailable. `startAt`/`date` are
 * kept a bit in the future on purpose; update these if they've drifted into
 * the past. `coordinate`/`locationConfidence` are intentionally left unset
 * here — services/events/eventLocationResolver.ts fills them in from
 * `locationId` uniformly for seed and live events alike.
 */
export const CAMPUS_EVENTS: CampusEvent[] = [
  {
    id: "welcome-fair",
    campusId: DEFAULT_CAMPUS_ID,
    title: "New Student Welcome Fair",
    description: "Meet campus orgs, grab freebies, and get your questions answered before the semester starts.",
    locationId: "red-square",
    startAt: "2026-08-17T16:00:00.000Z",
    date: "2026-08-17",
    category: "academic",
    expectedPopularity: "high",
    source: "seed",
  },
  {
    id: "club-interest-night",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Student Org Interest Night",
    description: "Drop by and learn about clubs looking for new members this semester.",
    locationId: "lauinger-library",
    startAt: "2026-08-19T23:00:00.000Z",
    date: "2026-08-19",
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
    startAt: "2026-08-20T15:00:00.000Z",
    date: "2026-08-20",
    category: "market",
    expectedPopularity: "medium",
    source: "seed",
  },
  {
    id: "midnight-mug-open-mic",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Midnight Mug Open Mic Night",
    description: "Student performers — music, poetry, comedy. Sign up at the door.",
    locationId: "midnight-mug",
    startAt: "2026-08-22T01:00:00.000Z",
    date: "2026-08-22",
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
    startAt: "2026-08-28T23:00:00.000Z",
    date: "2026-08-28",
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
    startAt: "2026-09-12T17:00:00.000Z",
    date: "2026-09-12",
    category: "sports",
    expectedPopularity: "high",
    source: "seed",
  },
];
