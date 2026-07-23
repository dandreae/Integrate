import type { ConstructionZone } from "@/types";
import { DEFAULT_CAMPUS_ID } from "./campuses";

export const CONSTRUCTION_ZONES: ConstructionZone[] = [
  {
    id: "prospect-street-sidewalk",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Prospect Street Sidewalk Repair",
    description:
      "Sidewalk closed for repaving between the main gates and the Tombs. Pedestrians are detoured into the street with cones.",
    coordinates: [
      { latitude: 38.9081, longitude: -77.0708 },
      { latitude: 38.9082, longitude: -77.0703 },
      { latitude: 38.9082, longitude: -77.0699 },
    ],
    severity: "medium",
    startDate: "2026-07-01",
    endDate: "2026-08-15",
    affectedAccessibility: true,
  },
  {
    id: "leavey-esplanade-repaving",
    campusId: DEFAULT_CAMPUS_ID,
    title: "Leavey Esplanade Repaving",
    description:
      "Main walkway between the ICC and Red Square is closed for repaving. No ramp detour currently in place — wheelchair users should route around via Hoya Court.",
    coordinates: [
      { latitude: 38.908, longitude: -77.0718 },
      { latitude: 38.9081, longitude: -77.072 },
      { latitude: 38.9082, longitude: -77.0721 },
    ],
    severity: "high",
    startDate: "2026-07-10",
    endDate: "2026-09-01",
    affectedAccessibility: true,
  },
];
