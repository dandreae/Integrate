import type { LatLng } from "@/types";
import { midpoint, pathDistanceMeters, perpendicularOffset } from "@/features/routing/geo";
import type { ProviderRouteCandidate, RoutingProvider, WalkingRouteQuery } from "../RoutingProvider";

/**
 * OFFLINE / DEMO-FALLBACK ONLY.
 *
 * This does not know about sidewalks, doors, or the real pedestrian network
 * — it bends a straight line between two points so the app has something to
 * show when the real routing provider (Valhalla) and cached demo fixtures
 * are both unavailable. Every Route built from this provider must be
 * labeled `source: "mock"` and surfaced to the user as simulated
 * (RealRouteRepository enforces this — see its `buildRoute`).
 *
 * It must NEVER be used to silently stand in for a real route without that
 * label, and it must NEVER claim accessibility — RouteCandidateScorer
 * already treats `hasDetectedSteps: true` on the direct candidate as a
 * caution, matching the old (removed) mock engine's behavior.
 */
const WALKING_SPEED_MPS = 1.35; // ~3 mph, average adult walking pace

function bentPath(origin: LatLng, destination: LatLng, bendMeters: number): LatLng[] {
  const bendPoint = perpendicularOffset(origin, destination, bendMeters);
  return [origin, bendPoint, destination];
}

function accessibleStyledPath(origin: LatLng, destination: LatLng): LatLng[] {
  // A wider, two-waypoint detour standing in for "routes via ramp/elevator
  // instead of the direct path" — cosmetic only, not derived from real data.
  const first = perpendicularOffset(origin, destination, 22);
  const second = perpendicularOffset(origin, destination, 34);
  return [origin, first, second, destination];
}

function toCandidate(path: LatLng[], hasDetectedSteps: boolean): ProviderRouteCandidate {
  const distanceMeters = pathDistanceMeters(path);
  return {
    coordinates: path,
    distanceMeters,
    durationSeconds: distanceMeters / WALKING_SPEED_MPS,
    hasDetectedSteps,
    // Never claims a steep grade — this is a straight-line simulation with no elevation data.
    hasDetectedSteepGrade: false,
  };
}

export class MockRoutingProvider implements RoutingProvider {
  readonly name = "mock-simulated";
  readonly isReal = false;

  async getWalkingRoute(query: WalkingRouteQuery): Promise<ProviderRouteCandidate[]> {
    const { origin, destination, preferAccessible } = query;

    if (preferAccessible) {
      // Only the accessible-styled detour — never claim steps on it.
      return [toCandidate(accessibleStyledPath(origin, destination), false)];
    }

    // Direct-ish candidate (simulated "may include stairs"), plus the same
    // accessible-styled detour so the scorer has something meaningfully
    // different to prefer for accessible/mostAccessible preferences even in
    // offline mode.
    return [
      toCandidate(bentPath(origin, destination, 8), true),
      toCandidate(accessibleStyledPath(origin, destination), false),
    ];
  }
}

/** Exposed for geographic sanity tests only. */
export const __testables = { bentPath, accessibleStyledPath, midpoint };
