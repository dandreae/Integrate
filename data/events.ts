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
    id: "farmers-market",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Georgetown Farmers Market",
    description: "Local produce, baked goods, and crafts from D.C.-area vendors.",
    locationId: "red-square",
    startAt: "2026-08-13T15:00:00.000Z",
    date: "2026-08-13",
    category: "market",
    expectedPopularity: "medium",
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
  {
    id: "midnight-mug-open-mic",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Midnight Mug Open Mic Night",
    description: "Student performers — music, poetry, comedy. Sign up at the door.",
    locationId: "midnight-mug",
    startAt: "2026-08-10T01:00:00.000Z",
    date: "2026-08-10",
    category: "social",
    expectedPopularity: "low",
    source: "seed",
  },
];
