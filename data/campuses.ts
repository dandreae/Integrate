import type { Campus } from "@/types";

/**
 * Sample campus for the MVP. Coordinates approximate Georgetown University's
 * main campus in Washington, D.C. Only one campus is supported for now, but
 * this stays an array so CampusRepository can grow into multi-campus later.
 */
export const CAMPUSES: Campus[] = [
  {
    id: "georgetown-university",
    name: "Georgetown University",
    latitude: 38.9076,
    longitude: -77.0723,
    mapRegion: {
      latitude: 38.9076,
      longitude: -77.0723,
      latitudeDelta: 0.0092,
      longitudeDelta: 0.0082,
    },
  },
];

export const DEFAULT_CAMPUS_ID = CAMPUSES[0].id;
