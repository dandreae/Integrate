import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FriendStatus } from "@/types";

interface FriendsState {
  /** Whether friends can see this device on the map. Local preference only — see types/mockUser.ts for why there's no live backend behind this yet. */
  visibleToFriends: boolean;
  myStatus: FriendStatus | null;
  setVisibleToFriends: (value: boolean) => void;
  setMyStatus: (status: FriendStatus | null) => void;
}

export const useFriendsStore = create<FriendsState>()(
  persist(
    (set) => ({
      visibleToFriends: true,
      myStatus: null,
      setVisibleToFriends: (value) => set({ visibleToFriends: value }),
      setMyStatus: (status) => set({ myStatus: status }),
    }),
    {
      name: "integrate/friends",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
