import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_CAMPUS_ID } from "@/data";

interface AppState {
  selectedCampusId: string;
  /** From onboarding: whether the user asked for accessibility-first routing by default. */
  prefersAccessibleRouting: boolean;
  hasCompletedOnboarding: boolean;
  setSelectedCampus: (campusId: string) => void;
  setPrefersAccessibleRouting: (value: boolean) => void;
  completeOnboarding: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedCampusId: DEFAULT_CAMPUS_ID,
      prefersAccessibleRouting: false,
      hasCompletedOnboarding: false,
      setSelectedCampus: (campusId) => set({ selectedCampusId: campusId }),
      setPrefersAccessibleRouting: (value) => set({ prefersAccessibleRouting: value }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: "integrate/app",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
