import { create } from "zustand";
import type { RoutePreference } from "@/types";

export type RouteOriginSelection = { type: "currentLocation" } | { type: "place"; placeId: string };

export interface PendingRouteRequest {
  origin: RouteOriginSelection;
  destinationPlaceId: string;
  preference: RoutePreference;
}

interface DirectionsState {
  /**
   * Set when "Directions" is requested from a screen other than the map
   * (the place detail screen, the route planner): those screens signal the
   * request here and hand control back to the map, which is the only place
   * that actually knows how to compute and draw a route. Not persisted —
   * this is a one-shot signal, not durable app state.
   */
  pendingRequest: PendingRouteRequest | null;
  /** Convenience for the common case: directions from the user's current location. */
  requestDirections: (destinationPlaceId: string, preference: RoutePreference) => void;
  requestRoute: (request: PendingRouteRequest) => void;
  clearPendingRequest: () => void;
}

export const useDirectionsStore = create<DirectionsState>((set) => ({
  pendingRequest: null,
  requestDirections: (destinationPlaceId, preference) =>
    set({ pendingRequest: { origin: { type: "currentLocation" }, destinationPlaceId, preference } }),
  requestRoute: (request) => set({ pendingRequest: request }),
  clearPendingRequest: () => set({ pendingRequest: null }),
}));
