import { create } from "zustand";

interface DirectionsState {
  /**
   * Set when "Directions" is tapped on a screen other than the map (e.g. the
   * place detail screen). The map screen watches this, draws the route once
   * it regains focus, then clears it. Not persisted — this is a one-shot
   * signal, not durable app state.
   */
  pendingDestinationId: string | null;
  /**
   * Optional companion to pendingDestinationId: when set, route FROM this
   * place instead of the user's current location — enables "building to
   * building" directions without needing (or waiting on) GPS.
   */
  pendingOriginId: string | null;
  requestDirections: (destinationId: string, originId?: string | null) => void;
  clearPendingDestination: () => void;
}

export const useDirectionsStore = create<DirectionsState>((set) => ({
  pendingDestinationId: null,
  pendingOriginId: null,
  requestDirections: (destinationId, originId = null) =>
    set({ pendingDestinationId: destinationId, pendingOriginId: originId }),
  clearPendingDestination: () => set({ pendingDestinationId: null, pendingOriginId: null }),
}));
