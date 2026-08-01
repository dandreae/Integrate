import { MockCampusRepository } from "./mock/MockCampusRepository";
import { MockPlaceRepository } from "./mock/MockPlaceRepository";
import { RealRouteRepository } from "./RealRouteRepository";
import { ValhallaRoutingProvider } from "../routing/valhalla/ValhallaRoutingProvider";
import { MockRoutingProvider } from "../routing/mock/MockRoutingProvider";

export type { CampusRepository } from "./CampusRepository";
export type { PlaceRepository } from "./PlaceRepository";
export type { RouteRepository } from "./RouteRepository";

/**
 * Active repository instances used throughout the app. Swapping these for
 * Supabase-backed (or other API-backed) implementations later is a one-line
 * change here — screens and stores only ever depend on the interfaces above.
 */
export const campusRepository = new MockCampusRepository();
export const placeRepository = new MockPlaceRepository();
export const routeRepository = new RealRouteRepository(new ValhallaRoutingProvider(), new MockRoutingProvider());
