import type { CampusReport } from "@/types";

/**
 * Seed reports so the "recent reports" indicator on construction zone
 * detail — and route-planning warnings — have something to show
 * immediately, without requiring a fresh submission first. Always
 * unverified/student-reported, same as any report a user submits through
 * the app. Written once to AsyncStorage on a true first launch by
 * `reportRepositoryFactory` (see `AsyncStorageReportRepository`'s
 * first-launch seeding).
 */
export const INITIAL_REPORTS: CampusReport[] = [
  {
    id: "seed-report-leavey-esplanade",
    issueType: "construction",
    relatedEntity: {
      type: "constructionZone",
      id: "leavey-esplanade-repaving",
      label: "Leavey Esplanade Repaving",
    },
    description:
      "Confirmed there's still no ramp detour — had to backtrack through Hoya Court to get a wheelchair around it.",
    severity: "high",
    expectedDuration: "Unknown",
    submittedAt: "2026-07-15T14:30:00.000Z",
    verificationStatus: "unverified",
    lifecycleStatus: "active",
    coordinates: { latitude: 38.9081, longitude: -77.072 },
    affectedRadiusMeters: 40,
  },
  {
    id: "seed-report-prospect-street",
    issueType: "path-closed",
    relatedEntity: {
      type: "constructionZone",
      id: "prospect-street-sidewalk",
      label: "Prospect Street Sidewalk Repair",
    },
    description: "Sidewalk is now fully fenced off, not just cones — pedestrians have to walk in the street.",
    severity: "medium",
    submittedAt: "2026-07-18T09:15:00.000Z",
    verificationStatus: "unverified",
    lifecycleStatus: "active",
    coordinates: { latitude: 38.9082, longitude: -77.0703 },
    affectedRadiusMeters: 40,
  },
  {
    id: "seed-report-healy-ramp",
    issueType: "ramp-blocked",
    relatedEntity: {
      type: "entrance",
      id: "healy-side",
      label: "Healy Hall — Side entrance near Dahlgren Quad",
    },
    description:
      "The ramp at the side entrance is blocked by scaffolding this week — had to find another way in.",
    severity: "high",
    expectedDuration: "Several days",
    submittedAt: "2026-07-21T16:00:00.000Z",
    verificationStatus: "unverified",
    lifecycleStatus: "active",
    expiresAt: "2026-07-26T00:00:00.000Z",
    coordinates: { latitude: 38.9086, longitude: -77.0731 },
    affectedRadiusMeters: 40,
  },
];
