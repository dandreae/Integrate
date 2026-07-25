import { makeConstructionZone, makeReport } from "@/test-utils/fixtures";
import { evaluateReportsForRoute, suggestAlternativePreference } from "../RouteReportEvaluator";

const NOW = new Date("2026-07-22T12:00:00.000Z");

// A short, roughly 50m route segment.
const ROUTE_COORDINATES = [
  { latitude: 38.908, longitude: -77.072 },
  { latitude: 38.9084, longitude: -77.0722 },
];

const FAR_AWAY = { latitude: 38.92, longitude: -77.08 };
const ON_ROUTE = { latitude: 38.9082, longitude: -77.0721 };

describe("evaluateReportsForRoute", () => {
  it("includes a report whose coordinates sit directly on the route", () => {
    const report = makeReport({
      id: "on-route",
      issueType: "path-closed",
      relatedEntity: { type: "general", id: "x", label: "X" },
      coordinates: ON_ROUTE,
    });

    const results = evaluateReportsForRoute({ routeCoordinates: ROUTE_COORDINATES, reports: [report], now: NOW });
    expect(results).toHaveLength(1);
    expect(results[0].reason).toBe("proximity");
    expect(results[0].approxDistanceMeters).not.toBeNull();
    expect(results[0].approxDistanceMeters!).toBeLessThan(40);
  });

  it("excludes a report far outside the affected radius with no entity match", () => {
    const report = makeReport({
      id: "far-report",
      issueType: "path-closed",
      relatedEntity: { type: "general", id: "x", label: "X" },
      coordinates: FAR_AWAY,
    });

    const results = evaluateReportsForRoute({ routeCoordinates: ROUTE_COORDINATES, reports: [report], now: NOW });
    expect(results).toHaveLength(0);
  });

  it("includes a construction-zone-linked report when that zone is near the route", () => {
    const zone = makeConstructionZone({
      id: "zone-1",
      title: "Test zone",
      coordinates: [ON_ROUTE],
    });
    const report = makeReport({
      id: "zone-report",
      issueType: "construction",
      relatedEntity: { type: "constructionZone", id: "zone-1", label: "Test zone" },
      severity: "high",
    });

    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [report],
      constructionZones: [zone],
      now: NOW,
    });
    expect(results).toHaveLength(1);
    expect(results[0].reason).toBe("constructionZone");
  });

  it("excludes a construction-zone-linked report when that zone is far from the route", () => {
    const zone = makeConstructionZone({
      id: "zone-2",
      title: "Far zone",
      coordinates: [FAR_AWAY],
    });
    const report = makeReport({
      id: "far-zone-report",
      issueType: "construction",
      relatedEntity: { type: "constructionZone", id: "zone-2", label: "Far zone" },
    });

    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [report],
      constructionZones: [zone],
      now: NOW,
    });
    expect(results).toHaveLength(0);
  });

  it("includes an entrance-linked report when the entrance belongs to the destination", () => {
    const report = makeReport({
      id: "entrance-report",
      issueType: "ramp-blocked",
      relatedEntity: { type: "entrance", id: "entrance-1", label: "Side entrance" },
      severity: "high",
    });

    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [report],
      destinationEntranceIds: ["entrance-1", "entrance-2"],
      now: NOW,
    });
    expect(results).toHaveLength(1);
    expect(results[0].reason).toBe("entrance");
  });

  it("includes a place-linked report when the place is the route destination", () => {
    const report = makeReport({
      id: "destination-report",
      issueType: "incorrect-info",
      relatedEntity: { type: "place", id: "place-1", label: "Some Place" },
    });

    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [report],
      destinationPlaceId: "place-1",
      now: NOW,
    });
    expect(results).toHaveLength(1);
    expect(results[0].reason).toBe("destination");
  });

  it("excludes an expired report even though its lifecycleStatus says active", () => {
    const report = makeReport({
      id: "expired-report",
      issueType: "path-closed",
      relatedEntity: { type: "general", id: "x", label: "X" },
      coordinates: ON_ROUTE,
      lifecycleStatus: "active",
      expiresAt: "2026-07-21T00:00:00.000Z", // before NOW
    });

    const results = evaluateReportsForRoute({ routeCoordinates: ROUTE_COORDINATES, reports: [report], now: NOW });
    expect(results).toHaveLength(0);
  });

  it("excludes a resolved report", () => {
    const report = makeReport({
      id: "resolved-report",
      issueType: "path-closed",
      relatedEntity: { type: "general", id: "x", label: "X" },
      coordinates: ON_ROUTE,
      lifecycleStatus: "resolved",
    });

    const results = evaluateReportsForRoute({ routeCoordinates: ROUTE_COORDINATES, reports: [report], now: NOW });
    expect(results).toHaveLength(0);
  });

  it("orders relevant reports by severity first, then proximity, then recency", () => {
    const lowSeverityClose = makeReport({
      id: "low-close",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      severity: "low",
      coordinates: ON_ROUTE,
      submittedAt: "2026-07-22T00:00:00.000Z",
    });
    const highSeverityFar = makeReport({
      id: "high-far",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      severity: "high",
      coordinates: { latitude: 38.9083, longitude: -77.0721 },
      submittedAt: "2026-07-20T00:00:00.000Z",
    });
    const highSeverityRecent = makeReport({
      id: "high-recent",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      severity: "high",
      coordinates: { latitude: 38.9083, longitude: -77.0721 },
      submittedAt: "2026-07-21T00:00:00.000Z",
    });

    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [lowSeverityClose, highSeverityFar, highSeverityRecent],
      now: NOW,
    });

    expect(results.map((r) => r.report.id)).toEqual(["high-recent", "high-far", "low-close"]);
  });
});

describe("suggestAlternativePreference", () => {
  it("returns null when there are no high-severity relevant reports", () => {
    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [
        makeReport({
          id: "low",
          issueType: "other",
          relatedEntity: { type: "general", id: "x", label: "X" },
          severity: "low",
          coordinates: ON_ROUTE,
        }),
      ],
      now: NOW,
    });
    expect(suggestAlternativePreference(results, "fastest")).toBeNull();
  });

  it("suggests 'accessible' for a high-severity accessibility issue", () => {
    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [
        makeReport({
          id: "ramp",
          issueType: "ramp-blocked",
          relatedEntity: { type: "general", id: "x", label: "X" },
          severity: "high",
          coordinates: ON_ROUTE,
        }),
      ],
      now: NOW,
    });
    const suggestion = suggestAlternativePreference(results, "fastest");
    expect(suggestion?.preference).toBe("accessible");
    expect(suggestion?.reason).toBeTruthy();
  });

  it("suggests 'avoidConstruction' for a high-severity construction issue", () => {
    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [
        makeReport({
          id: "construction",
          issueType: "construction",
          relatedEntity: { type: "general", id: "x", label: "X" },
          severity: "high",
          coordinates: ON_ROUTE,
        }),
      ],
      now: NOW,
    });
    const suggestion = suggestAlternativePreference(results, "fastest");
    expect(suggestion?.preference).toBe("avoidConstruction");
  });

  it("returns null when already on the preference it would otherwise suggest", () => {
    const results = evaluateReportsForRoute({
      routeCoordinates: ROUTE_COORDINATES,
      reports: [
        makeReport({
          id: "ramp2",
          issueType: "ramp-blocked",
          relatedEntity: { type: "general", id: "x", label: "X" },
          severity: "high",
          coordinates: ON_ROUTE,
        }),
      ],
      now: NOW,
    });
    expect(suggestAlternativePreference(results, "accessible")).toBeNull();
  });
});
