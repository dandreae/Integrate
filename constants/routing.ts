import type { RoutePreference } from "@/types";

/**
 * Central, documented tuning knobs for real pedestrian routing. Everything
 * that affects which candidate route "wins" for a given preference lives
 * here so it can be tuned without hunting through the scorer/repository.
 *
 * Scoring model: every candidate starts from its walking duration in
 * seconds, then preference-specific penalties (positive, worse) and bonuses
 * (negative, better) are added on top. Lowest score wins. See
 * services/routing/RouteCandidateScorer.ts for how these are applied.
 */
export const ROUTING_CONFIG = {
  provider: {
    /** Public OSM community Valhalla instance — no API key required. Override via env for a self-hosted/paid instance. */
    baseUrl: process.env.EXPO_PUBLIC_ROUTING_BASE_URL || "https://valhalla1.openstreetmap.de",
    /** Reserved for providers that require one (Valhalla's public demo does not). Never hardcode a real key here. */
    apiKey: process.env.EXPO_PUBLIC_ROUTING_API_KEY || undefined,
    /** Generous for a shared public demo server on campus Wi-Fi; a slow response still beats an unnecessary mock fallback. */
    requestTimeoutMs: 12000,
    /** How many alternate geometries to request per costing profile. */
    alternates: 2,
    /** Extra attempts (beyond the first) for network/timeout failures only — never retried for a genuine "no route". */
    retryAttempts: 1,
  },

  /** In-memory session route cache. No persistence, no TTL — cleared on app restart. */
  cache: {
    enabled: true,
  },

  coverage: {
    /**
     * Straight-line cutoff beyond which we refuse to even attempt a route —
     * including the mock fallback. Prevents "destination outside routing
     * coverage" (e.g. a device location simulator defaulting to somewhere
     * far from campus) from ever rendering a nonsense cross-country line
     * that happens to be technically "labeled simulated." A real walking
     * campus app has no business drawing anything past a few km.
     */
    maxStraightLineMeters: 8000,
  },

  scoring: {
    /**
     * Multiplier applied to raw walking duration (seconds) for the final
     * score. Lower weight means duration matters less relative to the
     * penalties/bonuses below — this is what lets Accessible and Most
     * Accessible trade time for accessibility confidence.
     */
    durationWeight: {
      fastest: 1,
      accessible: 0.6,
      mostAccessible: 0.3,
    } satisfies Record<RoutePreference, number>,

    /** Added when the provider's own geometry/instructions indicate steps/stairs on the route. */
    stairPenaltySeconds: {
      fastest: 0,
      accessible: 240,
      mostAccessible: 900,
    } satisfies Record<RoutePreference, number>,

    /** Added when the entrance used is known to be inaccessible. */
    inaccessibleEntrancePenaltySeconds: {
      fastest: 0,
      accessible: 300,
      mostAccessible: 1200,
    } satisfies Record<RoutePreference, number>,

    /** Added per nearby construction zone, before status/severity multipliers below. */
    constructionPenaltySeconds: {
      fastest: 30,
      accessible: 300,
      mostAccessible: 600,
    } satisfies Record<RoutePreference, number>,

    /** Extra multiplier on the construction penalty when a zone is flagged as accessibility-impacting. */
    constructionAccessibilityImpactMultiplier: {
      fastest: 1,
      accessible: 2.5,
      mostAccessible: 4,
    } satisfies Record<RoutePreference, number>,

    /** Added when we cannot verify accessibility of the entrance/route at all (no data). */
    accessibilityUncertaintyPenaltySeconds: {
      fastest: 0,
      accessible: 90,
      mostAccessible: 240,
    } satisfies Record<RoutePreference, number>,

    /** Subtracted (bonus) when the entrance used is known accessible. */
    accessibleEntranceBonusSeconds: {
      fastest: 0,
      accessible: 120,
      mostAccessible: 300,
    } satisfies Record<RoutePreference, number>,

    /** Additional bonus when that accessible entrance was verified within `verifiedRecencyDays`. */
    verifiedAccessibilityBonusSeconds: {
      fastest: 0,
      accessible: 60,
      mostAccessible: 180,
    } satisfies Record<RoutePreference, number>,

    verifiedRecencyDays: 90,

    /** A construction zone within this distance of the route path is considered "near" it. */
    constructionBufferMeters: 25,
  },
} as const;
