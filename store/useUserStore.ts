import { create } from "zustand";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "@/services/firebase";

interface UserState {
  uid: string | null;
  isReady: boolean;
  bootstrapAuth: () => void;
}

/**
 * Mirrors Firebase's own (AsyncStorage-persisted) anonymous auth session in
 * memory so components can read `uid` synchronously without subscribing to
 * onAuthStateChanged individually. Firebase auth persistence is the actual
 * source of truth — this store never persists on its own.
 */
export const useUserStore = create<UserState>((set, get) => ({
  uid: null,
  isReady: false,
  bootstrapAuth: () => {
    if (get().isReady) return;
    onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ uid: user.uid, isReady: true });
        return;
      }
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed", error);
      });
    });
  },
}));
