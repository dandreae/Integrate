import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Demo default so the Saved tab has events to show on a fresh install —
 * same reasoning as DEFAULT_SAVED_PLACE_IDS in useSavedPlacesStore. Only
 * applies the first time this device has never persisted its own value.
 */
const DEFAULT_SAVED_EVENT_IDS = ["welcome-fair", "farmers-market", "fall-kickoff-concert"];

interface SavedEventsState {
  savedEventIds: string[];
  /** Event ids with a local reminder notification scheduled — see services/notifications/eventReminders.ts. */
  reminderEventIds: string[];
  isSaved: (eventId: string) => boolean;
  hasReminder: (eventId: string) => boolean;
  toggleSaved: (eventId: string) => void;
  setReminder: (eventId: string, enabled: boolean) => void;
}

export const useSavedEventsStore = create<SavedEventsState>()(
  persist(
    (set, get) => ({
      savedEventIds: DEFAULT_SAVED_EVENT_IDS,
      reminderEventIds: [],
      isSaved: (eventId) => get().savedEventIds.includes(eventId),
      hasReminder: (eventId) => get().reminderEventIds.includes(eventId),
      toggleSaved: (eventId) =>
        set((state) => {
          const nowSaved = !state.savedEventIds.includes(eventId);
          return {
            savedEventIds: nowSaved
              ? [...state.savedEventIds, eventId]
              : state.savedEventIds.filter((id) => id !== eventId),
            // Unsaving clears the reminder flag too — the caller is still
            // responsible for canceling the actual scheduled OS notification
            // (see services/notifications/eventReminders.ts) as a side effect,
            // this store only tracks intent, not the native schedule itself.
            reminderEventIds: nowSaved
              ? state.reminderEventIds
              : state.reminderEventIds.filter((id) => id !== eventId),
          };
        }),
      setReminder: (eventId, enabled) =>
        set((state) => ({
          reminderEventIds: enabled
            ? state.reminderEventIds.includes(eventId)
              ? state.reminderEventIds
              : [...state.reminderEventIds, eventId]
            : state.reminderEventIds.filter((id) => id !== eventId),
        })),
    }),
    {
      name: "integrate/saved-events",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
