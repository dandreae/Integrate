import type { CampusReport, ConstructionZone, LatLng, RoutePreference } from "@/types";
import { distanceToPathMeters } from "@/features/routing/geo";
import { isReportActive } from "./reportLifecycle";
import { compareSeverityDescending } from "./reportSeverity";

const DEFAULT_PROXIMITY_RADIUS_METERS = 40;
const CONSTRUCTION_ZONE_PROXIMITY_METERS = 40;

export type RouteReportRelevanceReason = "destination" | "entrance" | "constructionZone" | "proximity";

export interface RelevantRouteReport {
  report: CampusReport;
  reason: RouteReportRelevanceReason;
  /** Approximate distance from the report's location to the route, in meters — null when relevance came from an entity match with no coordinates on the report. */
  approxDistanceMeters: number | null;
}

export interface RouteReportEvaluationInput {
  routeCoordinates: LatLng[];
  reports: CampusReport[];
  destinationPlaceId?: string;
  destinationEntranceIds?: string[];
  constructionZones?: ConstructionZone[];
  proximityRadiusMeters?: number;
  now?: Date;
}

function isConstructionZoneNearRoute(
  zone: ConstructionZone,
  routeCoordinates: LatLng[],
  radiusMeters: number
): boolean {
  return zone.coordinates.some((point) => distanceToPathMeters(point, routeCoordinates) <= radiusMeters);
}

/**
 * ROUTE REPORT EVALUATOR
 * ----------------------
 * Determines which currently-active reports are relevant to a computed
 * route and ranks them by severity, then proximity, then recency. Purely
 * read-only — it never mutates the route or the reports it's given, and it
 * never decides to reroute on its own; callers (UI) decide what to do with
 * the ranked list.
 */
export function evaluateReportsForRoute(input: RouteReportEvaluationInput): RelevantRouteReport[] {
  const {
    routeCoordinates,
    reports,
    destinationPlaceId,
    destinationEntranceIds,
    constructionZones,
    proximityRadiusMeters = DEFAULT_PROXIMITY_RADIUS_METERS,
    now = new Date(),
  } = input;

  const nearbyZoneIds = new Set(
    (constructionZones ?? [])
      .filter((zone) => isConstructionZoneNearRoute(zone, routeCoordinates, CONSTRUCTION_ZONE_PROXIMITY_METERS))
      .map((zone) => zone.id)
  );

  const relevant: RelevantRouteReport[] = [];

  for (const report of reports) {
    if (!isReportActive(report, now)) continue;

    const approxDistanceMeters = report.coordinates
      ? distanceToPathMeters(report.coordinates, routeCoordinates)
      : null;

    if (
      report.relatedEntity.type === "place" &&
      destinationPlaceId &&
      report.relatedEntity.id === destinationPlaceId
    ) {
      relevant.push({ report, reason: "destination", approxDistanceMeters });
      continue;
    }

    if (
      report.relatedEntity.type === "entrance" &&
      destinationEntranceIds?.includes(report.relatedEntity.id)
    ) {
      relevant.push({ report, reason: "entrance", approxDistanceMeters });
      continue;
    }

    if (report.relatedEntity.type === "constructionZone" && nearbyZoneIds.has(report.relatedEntity.id)) {
      relevant.push({ report, reason: "constructionZone", approxDistanceMeters });
      continue;
    }

    if (approxDistanceMeters !== null) {
      const radius = report.affectedRadiusMeters ?? proximityRadiusMeters;
      if (approxDistanceMeters <= radius) {
        relevant.push({ report, reason: "proximity", approxDistanceMeters });
      }
    }
  }

  return relevant.sort((a, b) => {
    const severityDiff = compareSeverityDescending(a.report.severity, b.report.severity);
    if (severityDiff !== 0) return severityDiff;

    const distanceA = a.approxDistanceMeters ?? Infinity;
    const distanceB = b.approxDistanceMeters ?? Infinity;
    if (distanceA !== distanceB) return distanceA - distanceB;

    return new Date(b.report.submittedAt).getTime() - new Date(a.report.submittedAt).getTime();
  });
}

export interface AlternativeRouteSuggestion {
  preference: RoutePreference;
  reason: string;
}

const ACCESSIBILITY_ISSUE_TYPES = new Set([
  "ramp-blocked",
  "elevator-unavailable",
  "entrance-locked",
  "accessibility-issue",
]);
const CONSTRUCTION_ISSUE_TYPES = new Set(["construction", "path-closed"]);

/**
 * Suggests an alternative route preference when a high-severity report is
 * relevant. Never applied automatically — only offered as an explicit
 * "Find another route" action, with the reason stated so the user
 * understands why an alternative is being suggested.
 */
export function suggestAlternativePreference(
  relevantReports: RelevantRouteReport[],
  currentPreference: RoutePreference
): AlternativeRouteSuggestion | null {
  const highSeverity = relevantReports.filter((entry) => entry.report.severity === "high");
  if (highSeverity.length === 0) return null;

  const hasAccessibilityIssue = highSeverity.some((entry) =>
    ACCESSIBILITY_ISSUE_TYPES.has(entry.report.issueType)
  );
  const hasConstructionIssue = highSeverity.some((entry) =>
    CONSTRUCTION_ISSUE_TYPES.has(entry.report.issueType)
  );

  // Each branch returns null when already on its best-fit preference,
  // rather than falling through to the generic fallback below — otherwise
  // an accessibility issue while already routing "accessible" would
  // incorrectly suggest switching to "avoidConstruction".
  if (hasAccessibilityIssue) {
    if (currentPreference === "accessible") return null;
    return {
      preference: "accessible",
      reason:
        "A high-severity accessibility issue was reported on this route — trying accessible routing instead.",
    };
  }

  if (hasConstructionIssue) {
    if (currentPreference === "avoidConstruction") return null;
    return {
      preference: "avoidConstruction",
      reason: "A high-severity construction report was found on this route — trying a route that avoids it.",
    };
  }

  if (currentPreference !== "avoidConstruction") {
    return {
      preference: "avoidConstruction",
      reason: "A high-severity issue was reported on this route — trying an alternative path.",
    };
  }

  return null;
}
