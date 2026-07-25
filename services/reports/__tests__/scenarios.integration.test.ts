import AsyncStorage from "@react-native-async-storage/async-storage";
import { PLACES } from "@/data";
import { AsyncStorageReportRepository } from "@/services/repositories/AsyncStorageReportRepository";
import { expectedDurationToExpiresAt, isReportActive } from "@/services/reports/reportLifecycle";
import { evaluateReportsForRoute, suggestAlternativePreference } from "@/services/reports/RouteReportEvaluator";
import { getPlaceTrustSignals, isDataOutdated } from "@/features/places/dataTrust";

beforeEach(async () => {
  await AsyncStorage.clear();
});

/**
 * These mirror the phase's manual verification scenarios end-to-end against
 * the real repository + evaluator stack (not just isolated units), so a
 * regression in how the pieces fit together fails a test instead of only
 * being caught by someone tapping through the app by hand.
 */
describe("Scenario A — submit a report, reload, plan a route, offer an alternative", () => {
  const healyHall = PLACES.find((place) => place.id === "healy-hall")!;
  const healySideEntranceId = "healy-side";

  it("a submitted high-severity ramp-blocked report survives a simulated app restart and surfaces as a route warning without auto-rerouting", async () => {
    // Submit, as the report form would.
    const repoBeforeRestart = new AsyncStorageReportRepository();
    const created = await repoBeforeRestart.createReport({
      issueType: "ramp-blocked",
      relatedEntity: { type: "entrance", id: healySideEntranceId, label: "Healy Hall — Side entrance" },
      description: "Scaffolding is blocking the ramp today.",
      severity: "high",
      expectedDuration: "Today",
      coordinates: { latitude: 38.9086, longitude: -77.0731 },
      affectedRadiusMeters: 40,
    });
    expect(created.lifecycleStatus).toBe("active");

    // "Reload the app": a brand-new repository instance, no shared memory.
    const repoAfterRestart = new AsyncStorageReportRepository();
    const allReports = await repoAfterRestart.getAllReports();
    expect(allReports.some((r) => r.id === created.id)).toBe(true);

    // Plan a route to Healy Hall (a route ending at/through the affected entrance).
    const routeCoordinates = [
      { latitude: 38.909, longitude: -77.074 },
      { latitude: 38.9088, longitude: -77.0733 }, // Healy Hall itself
    ];
    const relevant = evaluateReportsForRoute({
      routeCoordinates,
      reports: allReports,
      destinationPlaceId: healyHall.id,
      destinationEntranceIds: healyHall.entrances.map((e) => e.id),
    });

    expect(relevant.some((r) => r.report.id === created.id)).toBe(true);
    expect(relevant.find((r) => r.report.id === created.id)?.reason).toBe("entrance");

    // The route coordinates themselves are untouched — evaluation never mutates them.
    expect(routeCoordinates).toEqual([
      { latitude: 38.909, longitude: -77.074 },
      { latitude: 38.9088, longitude: -77.0733 },
    ]);

    // "Find another route" is offered, not applied automatically.
    const suggestion = suggestAlternativePreference(relevant, "fastest");
    expect(suggestion?.preference).toBe("accessible");
    expect(suggestion?.reason).toBeTruthy();
  });
});

describe("Scenario B — outdated place data is explained with its verification details", () => {
  it("flags a real outdated place and the explanation names its actual last-verified date and source", () => {
    const outdatedPlace = PLACES.find((place) => isDataOutdated(place.dataLastVerifiedAt));
    expect(outdatedPlace).toBeTruthy();

    const signals = getPlaceTrustSignals(outdatedPlace!, false);
    const outdatedSignal = signals.find((s) => s.kind === "outdated");
    expect(outdatedSignal).toBeTruthy();
    expect(outdatedSignal!.explanation).toContain(outdatedPlace!.dataLastVerifiedAt);
    expect(outdatedSignal!.explanation).toContain(outdatedPlace!.verificationSource);
  });
});

describe("Scenario C — a temporary report expires and stops being active", () => {
  it("a report with a 'Less than 1 hour' duration is active immediately and inactive after that hour passes", async () => {
    const submittedAt = new Date("2026-07-22T12:00:00.000Z");
    const expiresAt = expectedDurationToExpiresAt("Less than 1 hour", submittedAt);

    const repo = new AsyncStorageReportRepository();
    const created = await repo.createReport({
      issueType: "path-closed",
      relatedEntity: { type: "general", id: "test-path", label: "Test path" },
      description: "Temporary closure for a delivery truck.",
      severity: "low",
      expectedDuration: "Less than 1 hour",
      expiresAt,
      coordinates: { latitude: 38.9, longitude: -77.07 },
      affectedRadiusMeters: 40,
    });

    const justAfterSubmission = new Date(submittedAt.getTime() + 5 * 60 * 1000);
    expect(isReportActive(created, justAfterSubmission)).toBe(true);

    const wellPastExpiration = new Date(submittedAt.getTime() + 2 * 60 * 60 * 1000);
    expect(isReportActive(created, wellPastExpiration)).toBe(false);

    // And it drops out of route relevance once expired, without anyone
    // having to mutate its stored status.
    const routeCoordinates = [
      created.coordinates!,
      { latitude: created.coordinates!.latitude + 0.0001, longitude: created.coordinates!.longitude },
    ];
    const relevantBefore = evaluateReportsForRoute({
      routeCoordinates,
      reports: [created],
      now: justAfterSubmission,
    });
    const relevantAfter = evaluateReportsForRoute({
      routeCoordinates,
      reports: [created],
      now: wellPastExpiration,
    });

    expect(relevantBefore.length).toBe(1);
    expect(relevantAfter.length).toBe(0);
  });
});
