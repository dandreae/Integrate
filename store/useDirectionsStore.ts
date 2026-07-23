import { create } from "zustand";

interface DirectionsState {
  /**
   * Set when "Directions" is tapped on a screen other than the map (e.g. the
   * place detail screen). The map screen watches this, draws the route once
   * it regains focus, then clears it. Not persisted — this is a one-shot
   * signal, not durable app state.
   */
  pendingDestinationId: string | null;
  requestDirections: (placeId: string) => void;
  clearPendingDestination: () => void;
}

export const useDirectionsStore = create<DirectionsState>((set) => ({
  pendingDestinationId: null,
  requestDirections: (placeId) => set({ pendingDestinationId: placeId }),
  clearPendingDestination: () => set({ pendingDestinationId: null }),
}));
