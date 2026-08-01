import type { ConstructionZone, LatLng, Route, RouteOption, RoutePreference, RouteRequest } from "@/types";
import { ROUTING_CONFIG } from "@/constants/routing";
import { haversineDistanceMeters } from "@/features/routing/geo";
import {
  RoutingProviderError,
  type ProviderRouteCandidate,
  type RoutingProvider,
} from "../routing/RoutingProvider";
import { selectCandidateEntrances, type EntranceCandidate } from "../routing/entranceSelection";
import { scoreCandidate, type ScoreResult } from "../routing/RouteCandidateScorer";
import { findMatchingFixture } from "../routing/fixtures/demoRouteFixtures";
import { buildRouteCacheKey, getCachedRouteOptions, setCachedRouteOptions } from "../routing/routeCache";
import type { RouteRepository } from "./RouteRepository";

const PREFERENCES: RoutePreference[] = ["fastest", "accessible", "mostAccessible"];

const PREFERENCE_LABELS: Record<RoutePreference, string> = {
  fastest: "Fastest",
  accessible: "Accessible",
  mostAccessible: "Most Accessible",
};

interface Winner {
  candidate: ProviderRouteCandidate;
  entranceCandidate: EntranceCandidate;
  result: ScoreResult;
}

function describeFailure(error: unknown): string {
  if (error instanceof RoutingProviderError) {
    switch (error.reason) {
      case "network":
        return "Walking route unavailable — couldn't reach the routing service.";
      case "timeout":
        return "Walking route unavailable — the routing service took too long to respond.";
      case "missing-config":
        return "Walking route unavailable — routing isn't configured.";
      case "invalid-coordinates":
        return "Walking route unavailable — invalid location.";
      case "no-route":
        return "Walking route unavailable — no pedestrian route exists between these points.";
      default:
        return "Walking route unavailable.";
    }
  }
  return "Walking route unavailable.";
}

/** Runs default + accessible-biased requests for every entrance candidate. Throws only if every single request failed. */
async function fetchEntranceCandidates(
  provider: RoutingProvider,
  origin: LatLng,
  entranceCandidates: EntranceCandidate[]
): Promise<Map<EntranceCandidate, ProviderRouteCandidate[]>> {
  const jobs = entranceCandidates.flatMap((ec) => [
    provider
      .getWalkingRoute({ origin, destination: ec.point, preferAccessible: false })
      .then((candidates) => ({ ec, candidates })),
    provider
      .getWalkingRoute({ origin, destination: ec.point, preferAccessible: true })
      .then((candidates) => ({ ec, candidates })),
  ]);

  const results = await Promise.allSettled(jobs);

  const map = new Map<EntranceCandidate, ProviderRouteCandidate[]>();
  let firstError: unknown = null;
  for (const result of results) {
    if (result.status === "fulfilled") {
      const existing = map.get(result.value.ec) ?? [];
      map.set(result.value.ec, [...existing, ...result.value.candidates]);
    } else if (!firstError) {
      firstError = result.reason;
    }
  }

  if (map.size === 0 && firstError) {
    throw firstError;
  }
  return map;
}

function pickBest(
  preference: RoutePreference,
  entranceCandidates: EntranceCandidate[],
  candidatesByEntrance: Map<EntranceCandidate, ProviderRouteCandidate[]>,
  constructionZones: ConstructionZone[]
): Winner | null {
  let best: Winner | null = null;
  for (const entranceCandidate of entranceCandidates) {
    const candidates = candidatesByEntrance.get(entranceCandidate) ?? [];
    for (const candidate of candidates) {
      const result = scoreCandidate({ candidate, entranceCandidate, preference, constructionZones });
      if (result.rejected) continue;
      if (!best || result.score < best.result.score) {
        best = { candidate, entranceCandidate, result };
      }
    }
  }
  return best;
}

function buildReasons(preference: RoutePreference, winner: Winner, fastestWinner: Winner | null): string[] {
  const reasons: string[] = [];

  if (preference !== "fastest" && fastestWinner) {
    const diffSeconds = winner.candidate.durationSeconds - fastestWinner.candidate.durationSeconds;
    if (diffSeconds > 30) {
      reasons.push(`${Math.round(diffSeconds / 60)} min slower than Fastest`);
    } else if (diffSeconds < -30) {
      reasons.push(`${Math.round(Math.abs(diffSeconds) / 60)} min faster than Fastest`);
    } else {
      reasons.push("Same time as Fastest");
    }
  }

  if (winner.result.usedAccessibleEntrance) {
    reasons.push(
      winner.result.verifiedAccessibleEntrance ? "Accessible entrance (verified)" : "Uses accessible entrance"
    );
  }

  if (preference !== "fastest" && fastestWinner?.result.hasStairs && !winner.result.hasStairs) {
    reasons.push("Avoids stairs");
  }

  if (
    preference !== "fastest" &&
    (fastestWinner?.result.nearbyConstructionZones.length ?? 0) > 0 &&
    winner.result.nearbyConstructionZones.length === 0
  ) {
    reasons.push("Avoids construction");
  } else if (winner.result.nearbyConstructionZones.length > 0) {
    reasons.push(`Construction nearby: ${winner.result.nearbyConstructionZones[0].title}`);
  }

  if (preference !== "fastest" && winner.result.accessibilityConfidence === "none") {
    reasons.push("Accessible entrance could not be verified");
  }

  return reasons;
}

function buildRoute(preference: RoutePreference, winner: Winner, source: Route["source"]): Route {
  return {
    id: `route-${preference}-${source}-${winner.candidate.distanceMeters.toFixed(0)}`,
    coordinates: winner.candidate.coordinates,
    distanceMeters: Math.round(winner.candidate.distanceMeters),
    durationMinutes: Math.max(1, Math.round(winner.candidate.durationSeconds / 60)),
    preference,
    warnings: winner.result.warnings,
    source,
    entranceId: winner.entranceCandidate.entrance?.id,
    entranceLabel: winner.entranceCandidate.entrance?.label,
    accessibilityConfidence: winner.result.accessibilityConfidence,
  };
}

function unavailableOption(preference: RoutePreference, reason: string): RouteOption {
  return { preference, label: PREFERENCE_LABELS[preference], route: null, unavailableReason: reason, reasons: [] };
}

/**
 * Real RouteRepository implementation. Orchestrates:
 *  Layer 1 — a RoutingProvider returns physically feasible candidate
 *            geometries (real pedestrian network, or the labeled mock).
 *  Layer 2 — RouteCandidateScorer ranks those candidates per preference
 *            using our own campus entrance/construction data, which the
 *            provider knows nothing about.
 *
 * Failure order: real provider -> matching cached demo fixture (real
 * geometry, captured offline) -> mock provider (clearly labeled simulated)
 * -> explicit "unavailable". Never a synthesized straight line.
 */
export class RealRouteRepository implements RouteRepository {
  constructor(
    private readonly realProvider: RoutingProvider,
    private readonly fallbackProvider: RoutingProvider
  ) {}

  async getRouteOptions(request: RouteRequest): Promise<RouteOption[]> {
    const constructionZones = request.constructionZones ?? [];
    const cacheKey = buildRouteCacheKey(request.origin, request.destination, constructionZones);
    const cached = getCachedRouteOptions(cacheKey);
    if (cached) return cached;

    const options = await this.computeRouteOptions(request, constructionZones);
    setCachedRouteOptions(cacheKey, options);
    return options;
  }

  private tryFixtures(
    origin: LatLng,
    destination: LatLng,
    canonical: EntranceCandidate[]
  ): Map<EntranceCandidate, ProviderRouteCandidate[]> | null {
    const targetEntrance = canonical[0];
    if (!targetEntrance) return null;

    const defaultFixture = findMatchingFixture(origin, destination, false);
    const accessibleFixture = findMatchingFixture(origin, destination, true);
    if (!defaultFixture && !accessibleFixture) return null;

    const candidates: ProviderRouteCandidate[] = [];
    if (defaultFixture) candidates.push(defaultFixture.candidate);
    if (accessibleFixture) candidates.push(accessibleFixture.candidate);
    return new Map([[targetEntrance, candidates]]);
  }

  private async computeRouteOptions(
    request: RouteRequest,
    constructionZones: ConstructionZone[]
  ): Promise<RouteOption[]> {
    const straightLineMeters = haversineDistanceMeters(request.origin, request.destination);
    if (straightLineMeters > ROUTING_CONFIG.coverage.maxStraightLineMeters) {
      // Never attempt a route here — not even the mock. A distance this far
      // outside campus scale means the origin isn't actually where the app
      // thinks it is (e.g. a device location simulator's default location),
      // and a "simulated" line spanning that distance is exactly the
      // impossible-looking route this whole rework exists to prevent.
      return PREFERENCES.map((pref) =>
        unavailableOption(
          pref,
          "Your location seems far from campus, so walking directions aren't available. Check your device's location settings."
        )
      );
    }

    const canonical: EntranceCandidate[] = request.destinationPlace
      ? selectCandidateEntrances(request.destinationPlace, "fastest")
      : [{ point: request.destination, entrance: null, isKnownEntrance: false }];

    const accessibleSubset = canonical.filter((ec) => ec.entrance?.isAccessible === true);
    const effectiveAccessible = accessibleSubset.length > 0 ? accessibleSubset : canonical;

    const entranceCandidatesByPreference: Record<RoutePreference, EntranceCandidate[]> = {
      fastest: canonical,
      accessible: effectiveAccessible,
      mostAccessible: effectiveAccessible,
    };

    let source: Route["source"] = "real";
    let candidatesByEntrance: Map<EntranceCandidate, ProviderRouteCandidate[]>;

    try {
      candidatesByEntrance = await fetchEntranceCandidates(this.realProvider, request.origin, canonical);
    } catch (realError) {
      // eslint-disable-next-line no-console -- intentional: this is the only signal we get that live routing degraded.
      console.warn(
        `[routing] Real provider (${this.realProvider.name}) failed, falling back:`,
        realError instanceof RoutingProviderError ? `${realError.reason} — ${realError.message}` : realError
      );
      const fixtureMap = this.tryFixtures(request.origin, request.destination, canonical);
      if (fixtureMap) {
        source = "fixture";
        candidatesByEntrance = fixtureMap;
      } else {
        try {
          source = "mock";
          candidatesByEntrance = await fetchEntranceCandidates(this.fallbackProvider, request.origin, canonical);
        } catch {
          const message = describeFailure(realError);
          return PREFERENCES.map((pref) => unavailableOption(pref, message));
        }
      }
    }

    const winners = new Map<RoutePreference, Winner | null>();
    for (const preference of PREFERENCES) {
      winners.set(
        preference,
        pickBest(preference, entranceCandidatesByPreference[preference], candidatesByEntrance, constructionZones)
      );
    }
    const fastestWinner = winners.get("fastest") ?? null;

    return PREFERENCES.map((preference) => {
      const winner = winners.get(preference) ?? null;
      if (!winner) {
        return unavailableOption(
          preference,
          preference === "fastest"
            ? "No pedestrian route was found."
            : "No feasible route could be found for this preference — try Fastest instead."
        );
      }
      return {
        preference,
        label: PREFERENCE_LABELS[preference],
        route: buildRoute(preference, winner, source),
        reasons: buildReasons(preference, winner, fastestWinner),
      };
    });
  }
}
