import type { CampusReport, ConstructionZone, Place } from "@/types";

/** Minimal, fully-typed Place fixture factory shared across unit tests. */
export function makePlace(
  overrides: Partial<Place> & Pick<Place, "id" | "officialName" | "latitude" | "longitude">
): Place {
  return {
    campusId: "test-campus",
    localName: undefined,
    aliases: [],
    category: "academic",
    description: "",
    accessibilityFeatures: [],
    entrances: [],
    popularEntrances: [],
    studentTips: [],
    navigationTips: [],
    firstYearTips: [],
    accessibilityNotes: undefined,
    quietHours: undefined,
    busyHours: undefined,
    openingHours: { summary: "Always open" },
    nearbyPlaceIds: [],
    dataLastVerifiedAt: "2026-01-01",
    verificationSource: "Test fixture",
    confidenceLevel: "high",
    imageUrl: undefined,
    isSaved: false,
    ...overrides,
  };
}

export function makeReport(
  overrides: Partial<CampusReport> & Pick<CampusReport, "id" | "issueType" | "relatedEntity">
): CampusReport {
  return {
    description: "Test report description.",
    severity: undefined,
    expectedDuration: undefined,
    submittedAt: "2026-01-01T00:00:00.000Z",
    verificationStatus: "unverified",
    lifecycleStatus: "active",
    expiresAt: undefined,
    coordinates: undefined,
    affectedRadiusMeters: undefined,
    ...overrides,
  };
}

export function makeConstructionZone(
  overrides: Partial<ConstructionZone> & Pick<ConstructionZone, "id" | "title" | "coordinates">
): ConstructionZone {
  return {
    campusId: "test-campus",
    description: "",
    severity: "medium",
    startDate: "2026-01-01",
    endDate: "2026-02-01",
    affectedAccessibility: false,
    dataLastVerifiedAt: "2026-01-01",
    verificationSource: "Test fixture",
    ...overrides,
  };
}
