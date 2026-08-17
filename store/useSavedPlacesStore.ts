import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Demo default so the Saved tab isn't empty on a fresh install — matches
 * every other seeded demo dataset in this app (events, accessibility
 * reports, discover posts, mock friends all default to populated too).
 * Only applies the first time this device has never persisted its own
 * value; toggling a bookmark afterwards overrides it like normal.
 */
const DEFAULT_SAVED_PLACE_IDS = ["lauinger-library", "vital-vittles", "epicurean-and-company", "healy-tower"];

interface SavedPlacesState {
  savedPlaceIds: string[];
  isSaved: (placeId: string) => boolean;
  toggleSaved: (placeId: string) => void;
}

export const useSavedPlacesStore = create<SavedPlacesState>()(
  persist(
    (set, get) => ({
      savedPlaceIds: DEFAULT_SAVED_PLACE_IDS,
      isSaved: (placeId) => get().savedPlaceIds.includes(placeId),
      toggleSaved: (placeId) =>
        set((state) => ({
          savedPlaceIds: state.savedPlaceIds.includes(placeId)
            ? state.savedPlaceIds.filter((id) => id !== placeId)
            : [...state.savedPlaceIds, placeId],
        })),
    }),
    {
      name: "integrate/saved-places",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
