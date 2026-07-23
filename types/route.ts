import type { LatLng } from "./construction";

export type RoutePreference = "fastest" | "accessible" | "avoidConstruction";

export type RouteWarningType =
  | "stairs"
  | "steep-incline"
  | "construction"
  | "elevator-dependent"
  | "narrow-path"
  | "entrance-closed";

export type RouteWarningSeverity = "info" | "caution" | "high";

export interface RouteWarning {
  type: RouteWarningType;
  label: string;
  severity: RouteWarningSeverity;
  description: string;
}

export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  preference: RoutePreference;
}

export interface Route {
  id: string;
  coordinates: LatLng[];
  distanceMeters: number;
  durationMinutes: number;
  preference: RoutePreference;
  warnings: RouteWarning[];
}
