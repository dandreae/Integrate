import type { ConstructionZone, LatLng } from "./construction";
import type { Place } from "./place";

export type RoutePreference = "fastest" | "accessible" | "mostAccessible";

export type RouteWarningType =
  | "stairs"
  | "steep-incline"
  | "construction"
  | "elevator-dependent"
  | "narrow-path"
  | "entrance-closed"
  | "accessibility-unverified";

export type RouteWarningSeverity = "info" | "caution" | "high";

export interface RouteWarning {
  type: RouteWarningType;
  label: string;
  severity: RouteWarningSeverity;
  description: string;
}

/**
 * How confident we are in any accessibility claim attached to a route.
 * "verified" only when a real accessible entrance with verification data was
 * used and no accessibility-impacting construction is nearby. Never claim
 * "step-free" / "wheelchair accessible" / "fully accessible" outside that case.
 */
export type AccessibilityConfidence = "verified" | "unverified" | "none";

export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  /** When the destination is a known Place, enables entrance-aware routing. */
  destinationPlace?: Place;
  /** When the origin is a known Place, enables entrance-aware routing. */
  originPlace?: Place;
  /** Currently relevant construction zones (approved + seed), used for penalty/rejection scoring. */
  constructionZones?: ConstructionZone[];
}

export interface Route {
  id: string;
  coordinates: LatLng[];
  distanceMeters: number;
  durationMinutes: number;
  preference: RoutePreference;
  warnings: RouteWarning[];
  /** Real provider geometry vs. the offline/demo simulated engine. Must be surfaced in the UI when "mock". */
  source: "real" | "mock" | "fixture";
  entranceId?: string;
  entranceLabel?: string;
  accessibilityConfidence: AccessibilityConfidence;
}

/** One entry in the Fastest / Accessible / Most Accessible comparison. */
export interface RouteOption {
  preference: RoutePreference;
  label: string;
  route: Route | null;
  /** Set when this preference has no feasible route (e.g. no accessible entrance and none could be verified). */
  unavailableReason?: string;
  /** Short human-readable bullets explaining why this option looks the way it does, e.g. "2 min faster", "Uses accessible entrance". */
  reasons: string[];
}
