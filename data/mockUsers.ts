import type { MockCampusUser } from "@/types";
import { DEFAULT_CAMPUS_ID } from "./campuses";

/**
 * Demo-only "who's around" presence layer. Positions are small jittered
 * offsets (~15-30m) from real, already-verified place coordinates in
 * places.ts — not fabricated locations — so the dots land somewhere
 * plausible on campus instead of floating in the middle of a building or
 * off in the Potomac. savedEventIds reference real seeded events in
 * data/events.ts.
 */
export const MOCK_CAMPUS_USERS: MockCampusUser[] = [
  {
    id: "mock-ava",
    campusId: DEFAULT_CAMPUS_ID,
    name: "Ava M.",
    avatarInitials: "AM",
    avatarColor: "#E0A72E",
    currentLocation: { latitude: 38.90884, longitude: -77.07267 },
    savedEventIds: ["farmers-market", "fall-kickoff-concert"],
    status: "grabbing-food",
  },
  {
    id: "mock-marcus",
    campusId: DEFAULT_CAMPUS_ID,
    name: "Marcus T.",
    avatarInitials: "MT",
    avatarColor: "#3B5FE0",
    currentLocation: { latitude: 38.90738, longitude: -77.07182 },
    savedEventIds: ["homecoming-tailgate"],
    status: "in-class",
  },
  {
    id: "mock-priya",
    campusId: DEFAULT_CAMPUS_ID,
    name: "Priya S.",
    avatarInitials: "PS",
    avatarColor: "#7A5CE0",
    currentLocation: { latitude: 38.90664, longitude: -77.07249 },
    savedEventIds: [],
    status: "studying",
  },
  {
    id: "mock-jordan",
    campusId: DEFAULT_CAMPUS_ID,
    name: "Jordan K.",
    avatarInitials: "JK",
    avatarColor: "#E0304F",
    currentLocation: { latitude: 38.90626, longitude: -77.07538 },
    savedEventIds: ["midnight-mug-open-mic"],
    // No status set — exercises the "hasn't shared what they're up to" state.
  },
  {
    id: "mock-sam",
    campusId: DEFAULT_CAMPUS_ID,
    name: "Sam O.",
    avatarInitials: "SO",
    avatarColor: "#4FAE32",
    currentLocation: { latitude: 38.91031, longitude: -77.07443 },
    savedEventIds: ["farmers-market"],
    status: "free-to-hang",
  },
  {
    id: "mock-devon",
    campusId: DEFAULT_CAMPUS_ID,
    name: "Devon R.",
    avatarInitials: "DR",
    avatarColor: "#C23F9C",
    currentLocation: { latitude: 38.91151, longitude: -77.07358 },
    savedEventIds: ["fall-kickoff-concert", "homecoming-tailgate"],
    status: "chilling",
  },
];
