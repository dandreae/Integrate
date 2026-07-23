import type { CampusEvent } from "@/types";
import { DEFAULT_CAMPUS_ID } from "./campuses";

export const CAMPUS_EVENTS: CampusEvent[] = [
  {
    id: "farmers-market",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Georgetown Farmers Market",
    locationId: "red-square",
    date: "2026-07-30",
    category: "market",
    expectedPopularity: "medium",
  },
  {
    id: "fall-kickoff-concert",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Fall Kickoff Concert",
    locationId: "red-square",
    date: "2026-08-28",
    category: "concert",
    expectedPopularity: "high",
  },
  {
    id: "homecoming-tailgate",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Homecoming Blue & Gray Tailgate",
    locationId: "healy-lawn",
    date: "2026-09-12",
    category: "sports",
    expectedPopularity: "high",
  },
  {
    id: "midnight-mug-open-mic",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Midnight Mug Open Mic Night",
    locationId: "midnight-mug",
    date: "2026-08-06",
    category: "social",
    expectedPopularity: "low",
  },
];
