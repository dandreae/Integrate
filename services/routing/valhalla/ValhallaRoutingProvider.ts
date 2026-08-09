import type { LatLng } from "@/types";
import { ROUTING_CONFIG } from "@/constants/routing";
import {
  RoutingProviderError,
  type ProviderRouteCandidate,
  type RoutingProvider,
  type WalkingRouteQuery,
} from "../RoutingProvider";
import { decodePolyline6 } from "./polyline6";

interface ValhallaManeuver {
  instruction?: string;
  verbal_pre_transition_instruction?: string;
}

interface ValhallaLeg {
  shape: string;
  maneuvers?: ValhallaManeuver[];
}

interface ValhallaTrip {
  status: number;
  status_message?: string;
  summary: { time: number; length: number };
  legs: ValhallaLeg[];
}

interface ValhallaResponse {
  trip: ValhallaTrip;
  alternates?: { trip: ValhallaTrip }[];
}

const STEP_INSTRUCTION_PATTERN = /\bstep(s)?\b|\bstair(s)?\b/i;
const STEEP_INSTRUCTION_PATTERN = /\bsteep\b/i;

function isValidLatLng(point: LatLng): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

function tripToCandidate(trip: ValhallaTrip): ProviderRouteCandidate {
  const coordinates = trip.legs.flatMap((leg) => decodePolyline6(leg.shape));
  const hasDetectedSteps = trip.legs.some((leg) =>
    (leg.maneuvers ?? []).some(
      (m) =>
        STEP_INSTRUCTION_PATTERN.test(m.instruction ?? "") ||
        STEP_INSTRUCTION_PATTERN.test(m.verbal_pre_transition_instruction ?? "")
    )
  );
  const hasDetectedSteepGrade = trip.legs.some((leg) =>
    (leg.maneuvers ?? []).some(
      (m) =>
        STEEP_INSTRUCTION_PATTERN.test(m.instruction ?? "") ||
        STEEP_INSTRUCTION_PATTERN.test(m.verbal_pre_transition_instruction ?? "")
    )
  );

  return {
    coordinates,
    distanceMeters: trip.summary.length * 1000,
    durationSeconds: trip.summary.time,
    hasDetectedSteps,
    hasDetectedSteepGrade,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ValhallaRoutingProvider implements RoutingProvider {
  readonly name = "valhalla";
  readonly isReal = true;

  async getWalkingRoute(query: WalkingRouteQuery): Promise<ProviderRouteCandidate[]> {
    if (!isValidLatLng(query.origin) || !isValidLatLng(query.destination)) {
      throw new RoutingProviderError("Invalid coordinates for routing request.", "invalid-coordinates");
    }

    // Transient failures (network blips, a slow cold start, the shared demo
    // server briefly rate-limiting) shouldn't immediately punt the user to
    // the offline mock — retry once before giving up on the real provider.
    const attempts = ROUTING_CONFIG.provider.retryAttempts;
    let lastError: unknown;
    for (let attempt = 0; attempt <= attempts; attempt++) {
      try {
        return await this.requestOnce(query);
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof RoutingProviderError && (error.reason === "network" || error.reason === "timeout");
        if (!retryable || attempt === attempts) break;
        await delay(300 * (attempt + 1));
      }
    }
    throw lastError;
  }

  private async requestOnce(query: WalkingRouteQuery): Promise<ProviderRouteCandidate[]> {
    const prefs = query.accessibilityPreferences;
    // "Require" toggles bias the graph search harder than a plain "avoid" —
    // they still don't guarantee the property (Valhalla has no step-free
    // constraint), so RouteCandidateScorer still enforces them as hard
    // rejections downstream. This just makes the requested geometry more
    // likely to already satisfy them.
    const wantsStepAvoidance = query.preferAccessible || prefs?.avoidStairs || prefs?.requireStepFreeEntrance;
    const wantsSlopeAvoidance = query.preferAccessible || prefs?.avoidSteepSlopes;

    const body = {
      locations: [
        { lat: query.origin.latitude, lon: query.origin.longitude },
        { lat: query.destination.latitude, lon: query.destination.longitude },
      ],
      costing: "pedestrian",
      alternates: ROUTING_CONFIG.provider.alternates,
      costing_options: {
        pedestrian: {
          ...(wantsStepAvoidance
            ? { step_penalty: prefs?.requireStepFreeEntrance ? 1800 : 720 }
            : {}),
          ...(wantsSlopeAvoidance ? { use_hills: prefs?.avoidSteepSlopes ? 0.05 : 0.1 } : {}),
        },
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ROUTING_CONFIG.provider.requestTimeoutMs);

    let response: Response;
    try {
      response = await fetch(`${ROUTING_CONFIG.provider.baseUrl}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new RoutingProviderError("Routing request timed out.", "timeout");
      }
      throw new RoutingProviderError("Could not reach the routing service.", "network");
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new RoutingProviderError(
        `Routing service returned ${response.status}.`,
        response.status === 400 ? "no-route" : "network"
      );
    }

    let data: ValhallaResponse;
    try {
      data = await response.json();
    } catch {
      throw new RoutingProviderError("Routing service returned an unreadable response.", "unexpected");
    }

    if (!data.trip || data.trip.status !== 0) {
      throw new RoutingProviderError(
        data.trip?.status_message || "No pedestrian route was found between these points.",
        "no-route"
      );
    }

    const trips = [data.trip, ...(data.alternates ?? []).map((a) => a.trip)];
    return trips.map(tripToCandidate);
  }
}
