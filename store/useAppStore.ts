import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_CAMPUS_ID } from "@/data";
import { DEFAULT_ACCESSIBILITY_PREFERENCES, type AccessibilityPreferences } from "@/types";

interface AppState {
  selectedCampusId: string;
  /** From onboarding: whether the user asked for accessibility-first routing by default. */
  prefersAccessibleRouting: boolean;
  /** Explicit accessibility controls (avoid stairs, require elevator, etc.), set via the routing preferences sheet. */
  accessibilityPreferences: AccessibilityPreferences;
  hasCompletedOnboarding: boolean;
  setSelectedCampus: (campusId: string) => void;
  setPrefersAccessibleRouting: (value: boolean) => void;
  setAccessibilityPreferences: (value: AccessibilityPreferences) => void;
  completeOnboarding: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedCampusId: DEFAULT_CAMPUS_ID,
      prefersAccessibleRouting: false,
      accessibilityPreferences: DEFAULT_ACCESSIBILITY_PREFERENCES,
      hasCompletedOnboarding: false,
      setSelectedCampus: (campusId) => set({ selectedCampusId: campusId }),
      setPrefersAccessibleRouting: (value) => set({ prefersAccessibleRouting: value }),
      setAccessibilityPreferences: (value) => set({ accessibilityPreferences: value }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: "integrate/app",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
