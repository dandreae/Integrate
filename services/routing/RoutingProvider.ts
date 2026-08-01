import type { LatLng } from "@/types";

export interface WalkingRouteQuery {
  origin: LatLng;
  destination: LatLng;
  /** When true, ask the provider (if it supports it) to bias away from stairs/steep terrain. */
  preferAccessible?: boolean;
}

export interface ProviderRouteCandidate {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  /**
   * Best-effort signal from the provider's own turn-by-turn instructions
   * (e.g. an instruction mentioning "steps"). Not authoritative — a `false`
   * here means "not detected," not "confirmed step-free."
   */
  hasDetectedSteps: boolean;
}

export class RoutingProviderError extends Error {
  constructor(
    message: string,
    public readonly reason:
      | "network"
      | "timeout"
      | "no-route"
      | "invalid-coordinates"
      | "missing-config"
      | "unexpected"
  ) {
    super(message);
    this.name = "RoutingProviderError";
  }
}

export interface RoutingProvider {
  readonly name: string;
  /** True for providers backed by a real pedestrian network; false for the offline simulated engine. */
  readonly isReal: boolean;
  /**
   * Returns one or more candidate walking routes between two points. Throws
   * RoutingProviderError on failure — callers must not fall back to a
   * straight line themselves.
   */
  getWalkingRoute(query: WalkingRouteQuery): Promise<ProviderRouteCandidate[]>;
}
