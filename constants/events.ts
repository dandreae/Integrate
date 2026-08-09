/**
 * Central config for live event sourcing. See services/events/ for how
 * these are used — GeorgetownLiveWhaleProvider (the EventProvider) and
 * RealEventRepository (the Firestore cache-aside layer in front of it).
 */
export const EVENTS_CONFIG = {
  georgetown: {
    /** The only campus this provider currently knows how to fetch for. */
    campusId: "georgetown-university",
    /** Georgetown's public LiveWhale calendar — no API key required for read-only public event data. */
    baseUrl: process.env.EXPO_PUBLIC_EVENTS_BASE_URL || "https://events.georgetown.edu",
    requestTimeoutMs: 12000,
    /** Extra attempts (beyond the first) for network/timeout failures only. */
    retryAttempts: 1,
    /** How far into the future to request events — keeps the response small and relevant. */
    lookAheadDays: 60,
    /** LiveWhale's own guidance is <1 request/sec and to cache — one page is plenty for a campus-scale calendar. */
    maxResults: 150,
  },

  cache: {
    /**
     * How long a cached Firestore snapshot is considered fresh before a
     * client refetches from the live source and writes back. There's no
     * Cloud Functions on the Spark plan to do this on a schedule server-side
     * (see firestore.rules), so whichever client's app load finds the cache
     * stale performs the refresh — redundant concurrent refreshes are
     * harmless for read-mostly calendar data.
     */
    ttlMinutes: 60,
  },
} as const;
