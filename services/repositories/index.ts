import { MockCampusRepository } from "./mock/MockCampusRepository";
import { MockPlaceRepository } from "./mock/MockPlaceRepository";
import { MockAccessibilityReportRepository } from "./mock/MockAccessibilityReportRepository";
import { MockDiscoverPostRepository } from "./mock/MockDiscoverPostRepository";
import { MockEventRepository } from "./mock/MockEventRepository";
import { RealRouteRepository } from "./RealRouteRepository";
import { RealEventRepository } from "./RealEventRepository";
import { ValhallaRoutingProvider } from "../routing/valhalla/ValhallaRoutingProvider";
import { MockRoutingProvider } from "../routing/mock/MockRoutingProvider";
import { GeorgetownLiveWhaleProvider } from "../events/georgetown/GeorgetownLiveWhaleProvider";
import { geocodingProvider } from "../geocoding";
import { FirestoreAccessibilityReportRepository } from "./firestore/accessibilityReportsRepository";
import { FirestoreDiscoverPostRepository } from "./firestore/discoverPostsRepository";

export type { CampusRepository } from "./CampusRepository";
export type { PlaceRepository } from "./PlaceRepository";
export type { RouteRepository } from "./RouteRepository";
export type { AccessibilityReportRepository } from "./AccessibilityReportRepository";
export type { DiscoverPostRepository } from "./DiscoverPostRepository";
export type { EventRepository } from "./EventRepository";

/**
 * Active repository instances used throughout the app. Swapping these for
 * Supabase-backed (or other API-backed) implementations later is a one-line
 * change here — screens and stores only ever depend on the interfaces above.
 */
export const campusRepository = new MockCampusRepository();
export const placeRepository = new MockPlaceRepository();
export const routeRepository = new RealRouteRepository(new ValhallaRoutingProvider(), new MockRoutingProvider());

/**
 * "mock" (default): seeded demo data from data/accessibilityReports.ts,
 * in-memory only for the session — safe for a demo, no Firebase writes.
 * "live": real Firestore-backed reports, shared across users in real time.
 * Toggle with EXPO_PUBLIC_ACCESSIBILITY_REPORTS_MODE in .env.
 */
const accessibilityReportsMode = process.env.EXPO_PUBLIC_ACCESSIBILITY_REPORTS_MODE === "live" ? "live" : "mock";
export const accessibilityReportRepository =
  accessibilityReportsMode === "live"
    ? new FirestoreAccessibilityReportRepository()
    : new MockAccessibilityReportRepository();

/**
 * "mock" (default): seeded demo data from data/discoverPosts.ts, in-memory
 * only for the session. "live": real Firestore-backed feed, shared across
 * users in real time. Toggle with EXPO_PUBLIC_DISCOVER_MODE in .env.
 */
const discoverMode = process.env.EXPO_PUBLIC_DISCOVER_MODE === "live" ? "live" : "mock";
export const discoverPostRepository =
  discoverMode === "live" ? new FirestoreDiscoverPostRepository() : new MockDiscoverPostRepository();

const mockEventRepository = new MockEventRepository(placeRepository, campusRepository, geocodingProvider);

/**
 * "mock" (default): curated seed data from data/events.ts — no network,
 * safe offline demo. "live": fetches Georgetown's public LiveWhale events
 * calendar, resolves each event to a map coordinate, and caches the result
 * in Firestore (services/repositories/firestore/eventsCache.ts). Also the
 * fallback if the live feed and cache both fail. Toggle with
 * EXPO_PUBLIC_EVENTS_MODE in .env.
 */
const eventsMode = process.env.EXPO_PUBLIC_EVENTS_MODE === "live" ? "live" : "mock";
export const eventRepository =
  eventsMode === "live"
    ? new RealEventRepository(
        new GeorgetownLiveWhaleProvider(),
        placeRepository,
        campusRepository,
        geocodingProvider,
        mockEventRepository
      )
    : mockEventRepository;
