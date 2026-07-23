import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SavedPlacesState {
  savedPlaceIds: string[];
  isSaved: (placeId: string) => boolean;
  toggleSaved: (placeId: string) => void;
}

export const useSavedPlacesStore = create<SavedPlacesState>()(
  persist(
    (set, get) => ({
      savedPlaceIds: [],
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
