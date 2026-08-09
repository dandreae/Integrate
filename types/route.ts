import type { AccessibilityReport } from "./accessibilityReport";
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
  | "entrance-temporarily-closed"
  | "accessibility-unverified"
  | "accessibility-report";

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

/**
 * Explicit, user-set accessibility controls — independent of `RoutePreference`.
 * "Avoid" toggles steer scoring away from the trait with a heavy penalty but
 * will still return a route if it's the only option. "Require" toggles are
 * hard constraints: a candidate that can't satisfy them is rejected outright.
 */
export interface AccessibilityPreferences {
  avoidStairs: boolean;
  avoidSteepSlopes: boolean;
  requireElevator: boolean;
  requireStepFreeEntrance: boolean;
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  avoidStairs: false,
  avoidSteepSlopes: false,
  requireElevator: false,
  requireStepFreeEntrance: false,
};

export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  /** When the destination is a known Place, enables entrance-aware routing. */
  destinationPlace?: Place;
  /** When the origin is a known Place, enables entrance-aware routing. */
  originPlace?: Place;
  /** Currently relevant construction zones (approved + seed), used for penalty/rejection scoring. */
  constructionZones?: ConstructionZone[];
  /** Active/resolved accessibility reports (elevator outages, blocked ramps, etc.), used for penalty/rejection scoring. */
  accessibilityReports?: AccessibilityReport[];
  /** Explicit user accessibility controls (avoid stairs, require elevator, etc.). */
  accessibilityPreferences?: AccessibilityPreferences;
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
  /** `reasons` composed into one natural-language sentence, e.g. "2 min slower, but avoids stairs and uses a verified accessible entrance." */
  explanation?: string;
}
