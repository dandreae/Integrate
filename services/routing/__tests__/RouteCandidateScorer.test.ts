import { describe, expect, it } from "vitest";
import type { AccessibilityReport, ConstructionZone, Entrance, LatLng } from "@/types";
import type { ProviderRouteCandidate } from "../RoutingProvider";
import type { EntranceCandidate } from "../entranceSelection";
import { scoreCandidate } from "../RouteCandidateScorer";

const ORIGIN: LatLng = { latitude: 38.9076, longitude: -77.0723 };
const DEST: LatLng = { latitude: 38.9066, longitude: -77.0745 };

function straightCandidate(overrides: Partial<ProviderRouteCandidate> = {}): ProviderRouteCandidate {
  return {
    coordinates: [ORIGIN, DEST],
    distanceMeters: 250,
    durationSeconds: 200,
    hasDetectedSteps: false,
    hasDetectedSteepGrade: false,
    ...overrides,
  };
}

function entranceCandidate(overrides: Partial<EntranceCandidate> = {}): EntranceCandidate {
  return { point: DEST, entrance: null, isKnownEntrance: false, ...overrides };
}

function accessibleEntrance(overrides: Partial<Entrance> = {}): Entrance {
  return {
    id: "e1",
    placeId: "p1",
    latitude: DEST.latitude,
    longitude: DEST.longitude,
    label: "Ramp entrance",
    isAccessible: true,
    ...overrides,
  };
}

function report(overrides: Partial<AccessibilityReport> = {}): AccessibilityReport {
  return {
    id: "r1",
    placeId: "dest-place",
    issueType: "elevator-out",
    description: "Elevator is out of service.",
    reportedAt: "2026-01-01T00:00:00.000Z",
    status: "active",
    confirmCount: 2,
    ...overrides,
  };
}

function zone(overrides: Partial<ConstructionZone> = {}): ConstructionZone {
  return {
    id: "z1",
    campusId: "c1",
    title: "Sidewalk repair",
    description: "Sidewalk closed for repair.",
    // sits on the straight-line path between ORIGIN and DEST
    coordinates: [{ latitude: 38.9071, longitude: -77.0734 }],
    severity: "medium",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    affectedAccessibility: false,
    ...overrides,
  };
}

describe("scoreCandidate", () => {
  it("fastest ignores stairs and accessibility uncertainty in ranking terms it doesn't weight", () => {
    const result = scoreCandidate({
      candidate: straightCandidate({ hasDetectedSteps: true }),
      entranceCandidate: entranceCandidate(),
      preference: "fastest",
      constructionZones: [],
    });
    // Fastest score should equal duration (weight 1, zero stair penalty).
    expect(result.score).toBe(200);
    expect(result.rejected).toBe(false);
  });

  it("accessible and mostAccessible penalize detected stairs, mostAccessible more heavily", () => {
    const mostAccessibleNoStairs = scoreCandidate({
      candidate: straightCandidate({ hasDetectedSteps: false }),
      entranceCandidate: entranceCandidate(),
      preference: "mostAccessible",
      constructionZones: [],
    });
    const mostAccessibleWithStairs = scoreCandidate({
      candidate: straightCandidate({ hasDetectedSteps: true }),
      entranceCandidate: entranceCandidate(),
      preference: "mostAccessible",
      constructionZones: [],
    });
    expect(mostAccessibleWithStairs.score).toBeGreaterThan(mostAccessibleNoStairs.score);

    // The absolute stair penalty (score delta) should be larger for
    // mostAccessible than for accessible — it cares more about avoiding stairs.
    const accessibleNoStairs = scoreCandidate({
      candidate: straightCandidate({ hasDetectedSteps: false }),
      entranceCandidate: entranceCandidate(),
      preference: "accessible",
      constructionZones: [],
    });
    const accessibleWithStairs = scoreCandidate({
      candidate: straightCandidate({ hasDetectedSteps: true }),
      entranceCandidate: entranceCandidate(),
      preference: "accessible",
      constructionZones: [],
    });
    const mostAccessibleDelta = mostAccessibleWithStairs.score - mostAccessibleNoStairs.score;
    const accessibleDelta = accessibleWithStairs.score - accessibleNoStairs.score;
    expect(mostAccessibleDelta).toBeGreaterThan(accessibleDelta);
  });

  it("rewards a known accessible, recently verified entrance", () => {
    const unverified = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate({ entrance: accessibleEntrance(), isKnownEntrance: true }),
      preference: "accessible",
      constructionZones: [],
    });
    const verified = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate({
        entrance: accessibleEntrance({ accessibilityVerifiedAt: new Date().toISOString() }),
        isKnownEntrance: true,
      }),
      preference: "accessible",
      constructionZones: [],
    });
    expect(verified.accessibilityConfidence).toBe("verified");
    expect(unverified.accessibilityConfidence).toBe("unverified");
    expect(verified.score).toBeLessThan(unverified.score);
  });

  it("flags missing entrance data as unverifiable accessibility, never claiming accessibility", () => {
    const result = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(), // no entrance data at all
      preference: "mostAccessible",
      constructionZones: [],
    });
    expect(result.accessibilityConfidence).toBe("none");
    expect(result.warnings.some((w) => w.type === "accessibility-unverified")).toBe(true);
  });

  it("penalizes but does not reject a route near a reported (unverified) construction zone", () => {
    const clear = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "accessible",
      constructionZones: [],
    });
    const nearReported = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "accessible",
      constructionZones: [zone({ status: "reported" })],
    });
    expect(nearReported.rejected).toBe(false);
    expect(nearReported.score).toBeGreaterThan(clear.score);
    expect(nearReported.nearbyConstructionZones).toHaveLength(1);
  });

  it("rejects a route that crosses a confirmed closure, for every preference", () => {
    for (const preference of ["fastest", "accessible", "mostAccessible"] as const) {
      const result = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate(),
        preference,
        constructionZones: [zone({ status: "confirmed-closure" })],
      });
      expect(result.rejected).toBe(true);
      expect(result.score).toBe(Number.POSITIVE_INFINITY);
    }
  });

  it("applies a stronger construction penalty when the zone affects accessibility, for accessible preferences", () => {
    const generic = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "mostAccessible",
      constructionZones: [zone({ affectedAccessibility: false })],
    });
    const accessibilityImpacting = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "mostAccessible",
      constructionZones: [zone({ affectedAccessibility: true })],
    });
    expect(accessibilityImpacting.score).toBeGreaterThan(generic.score);
  });

  it("penalizes a route to a destination with an active matching accessibility report", () => {
    const clear = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "accessible",
      constructionZones: [],
      accessibilityReports: [],
      destinationPlaceId: "dest-place",
    });
    const reported = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "accessible",
      constructionZones: [],
      accessibilityReports: [report()],
      destinationPlaceId: "dest-place",
    });
    expect(reported.score).toBeGreaterThan(clear.score);
    expect(reported.matchedAccessibilityReports).toHaveLength(1);
    expect(reported.warnings.some((w) => w.type === "accessibility-report")).toBe(true);
  });

  it("ignores a resolved report and a report for a different place", () => {
    const resolved = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "accessible",
      constructionZones: [],
      accessibilityReports: [report({ status: "resolved" })],
      destinationPlaceId: "dest-place",
    });
    const wrongPlace = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "accessible",
      constructionZones: [],
      accessibilityReports: [report({ placeId: "some-other-place" })],
      destinationPlaceId: "dest-place",
    });
    expect(resolved.matchedAccessibilityReports).toHaveLength(0);
    expect(wrongPlace.matchedAccessibilityReports).toHaveLength(0);
  });

  it("only applies an entrance-scoped report to routes using that specific entrance", () => {
    const otherEntrance = accessibleEntrance({ id: "e2", label: "Other entrance" });
    const scopedReport = report({ entranceId: "e1" });

    const usingReportedEntrance = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate({ entrance: accessibleEntrance(), isKnownEntrance: true }),
      preference: "accessible",
      constructionZones: [],
      accessibilityReports: [scopedReport],
      destinationPlaceId: "dest-place",
    });
    const usingDifferentEntrance = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate({ entrance: otherEntrance, isKnownEntrance: true }),
      preference: "accessible",
      constructionZones: [],
      accessibilityReports: [scopedReport],
      destinationPlaceId: "dest-place",
    });

    expect(usingReportedEntrance.matchedAccessibilityReports).toHaveLength(1);
    expect(usingDifferentEntrance.matchedAccessibilityReports).toHaveLength(0);
  });

  it("fastest ignores accessibility reports (zero weight, matches design for the other accessibility penalties)", () => {
    const result = scoreCandidate({
      candidate: straightCandidate(),
      entranceCandidate: entranceCandidate(),
      preference: "fastest",
      constructionZones: [],
      accessibilityReports: [report()],
      destinationPlaceId: "dest-place",
    });
    expect(result.score).toBe(200);
  });

  describe("explicit accessibility preferences", () => {
    it("avoidStairs adds a large flat penalty, even for fastest, without rejecting", () => {
      const withoutToggle = scoreCandidate({
        candidate: straightCandidate({ hasDetectedSteps: true }),
        entranceCandidate: entranceCandidate(),
        preference: "fastest",
        constructionZones: [],
      });
      const withToggle = scoreCandidate({
        candidate: straightCandidate({ hasDetectedSteps: true }),
        entranceCandidate: entranceCandidate(),
        preference: "fastest",
        constructionZones: [],
        accessibilityPreferences: {
          avoidStairs: true,
          avoidSteepSlopes: false,
          requireElevator: false,
          requireStepFreeEntrance: false,
        },
      });
      expect(withToggle.rejected).toBe(false);
      expect(withToggle.score).toBeGreaterThan(withoutToggle.score);
    });

    it("avoidSteepSlopes adds a large flat penalty when the route or entrance ramp is steep", () => {
      const flat = scoreCandidate({
        candidate: straightCandidate({ hasDetectedSteepGrade: true }),
        entranceCandidate: entranceCandidate(),
        preference: "accessible",
        constructionZones: [],
      });
      const steered = scoreCandidate({
        candidate: straightCandidate({ hasDetectedSteepGrade: true }),
        entranceCandidate: entranceCandidate(),
        preference: "accessible",
        constructionZones: [],
        accessibilityPreferences: {
          avoidStairs: false,
          avoidSteepSlopes: true,
          requireElevator: false,
          requireStepFreeEntrance: false,
        },
      });
      expect(steered.rejected).toBe(false);
      expect(steered.score).toBeGreaterThan(flat.score);
      expect(steered.hasSteepSlope).toBe(true);
    });

    it("requireStepFreeEntrance rejects an unknown or stair-having entrance, even for fastest", () => {
      const preferences = {
        avoidStairs: false,
        avoidSteepSlopes: false,
        requireElevator: false,
        requireStepFreeEntrance: true,
      };
      const unknownEntrance = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate(),
        preference: "fastest",
        constructionZones: [],
        accessibilityPreferences: preferences,
      });
      const stairsEntrance = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate({
          entrance: accessibleEntrance({ hasStairs: true }),
          isKnownEntrance: true,
        }),
        preference: "fastest",
        constructionZones: [],
        accessibilityPreferences: preferences,
      });
      expect(unknownEntrance.rejected).toBe(true);
      expect(stairsEntrance.rejected).toBe(true);
    });

    it("requireStepFreeEntrance accepts a verified step-free accessible entrance", () => {
      const result = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate({ entrance: accessibleEntrance(), isKnownEntrance: true }),
        preference: "fastest",
        constructionZones: [],
        accessibilityPreferences: {
          avoidStairs: false,
          avoidSteepSlopes: false,
          requireElevator: false,
          requireStepFreeEntrance: true,
        },
      });
      expect(result.rejected).toBe(false);
    });

    it("requireElevator rejects when the destination's elevator isn't confirmed available", () => {
      const preferences = {
        avoidStairs: false,
        avoidSteepSlopes: false,
        requireElevator: true,
        requireStepFreeEntrance: false,
      };
      const unknown = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate(),
        preference: "fastest",
        constructionZones: [],
        accessibilityPreferences: preferences,
      });
      const outOfService = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate(),
        preference: "fastest",
        constructionZones: [],
        accessibilityPreferences: preferences,
        destinationElevatorStatus: "out-of-service",
      });
      const available = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate(),
        preference: "fastest",
        constructionZones: [],
        accessibilityPreferences: preferences,
        destinationElevatorStatus: "available",
      });
      expect(unknown.rejected).toBe(true);
      expect(outOfService.rejected).toBe(true);
      expect(available.rejected).toBe(false);
    });
  });

  describe("granular entrance characteristics", () => {
    it("rewards an automatic door and a curb cut with a lower score", () => {
      const plain = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate({ entrance: accessibleEntrance(), isKnownEntrance: true }),
        preference: "accessible",
        constructionZones: [],
      });
      const enhanced = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate({
          entrance: accessibleEntrance({ hasAutomaticDoor: true, hasCurbCut: true }),
          isKnownEntrance: true,
        }),
        preference: "accessible",
        constructionZones: [],
      });
      expect(enhanced.usedAutomaticDoor).toBe(true);
      expect(enhanced.usedCurbCut).toBe(true);
      expect(enhanced.score).toBeLessThan(plain.score);
    });

    it("penalizes and warns on a door narrower than the ADA minimum", () => {
      const result = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate({
          entrance: accessibleEntrance({ doorWidthInches: 24 }),
          isKnownEntrance: true,
        }),
        preference: "accessible",
        constructionZones: [],
      });
      expect(result.hasNarrowDoor).toBe(true);
      expect(result.warnings.some((w) => w.type === "narrow-path")).toBe(true);
    });

    it("rejects a route to an entrance with a known temporary closure, for every preference", () => {
      for (const preference of ["fastest", "accessible", "mostAccessible"] as const) {
        const result = scoreCandidate({
          candidate: straightCandidate(),
          entranceCandidate: entranceCandidate({
            entrance: accessibleEntrance({ temporaryClosure: { reason: "Door repair" } }),
            isKnownEntrance: true,
          }),
          preference,
          constructionZones: [],
        });
        expect(result.rejected).toBe(true);
        expect(result.score).toBe(Number.POSITIVE_INFINITY);
      }
    });

    it("warns when the destination's elevator is reported out of service, for non-fastest preferences", () => {
      const result = scoreCandidate({
        candidate: straightCandidate(),
        entranceCandidate: entranceCandidate(),
        preference: "accessible",
        constructionZones: [],
        destinationElevatorStatus: "out-of-service",
      });
      expect(result.warnings.some((w) => w.type === "elevator-dependent")).toBe(true);
    });
  });
});
