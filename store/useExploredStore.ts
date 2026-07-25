import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ExploredState {
  exploredPlaceIds: string[];
  markExplored: (placeId: string) => void;
}

/**
 * Purely for demo polish (Campus Stats) — tracks which places a student has
 * looked at (previewed or opened) so the app can reflect "you've explored
 * 12 landmarks, 6 study spots..." back to them. Not analytics, nothing
 * leaves the device.
 */
export const useExploredStore = create<ExploredState>()(
  persist(
    (set, get) => ({
      exploredPlaceIds: [],
      markExplored: (placeId) => {
        if (get().exploredPlaceIds.includes(placeId)) return;
        set((state) => ({ exploredPlaceIds: [...state.exploredPlaceIds, placeId] }));
      },
    }),
    {
      name: "integrate/explored",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
