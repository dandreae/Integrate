import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers this device for Expo push and saves the token to
 * `users/{uid}.pushToken` so Cloud Functions can fan out proposal
 * notifications. No-ops on simulators/emulators — push tokens require a
 * physical device and a custom EAS dev client (Expo Go can't receive remote
 * push as of SDK 53+).
 */
export async function registerForPushNotificationsAsync(uid: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn("Missing EAS project id — run `eas build:configure` before requesting a push token.");
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await setDoc(doc(db, "users", uid), { pushToken: token, createdAt: Date.now() }, { merge: true });
  return token;
}

/** Deep-links a tapped push notification into the proposal it references. */
export function addProposalNotificationResponseListener(
  onProposalTapped: (proposalId: string) => void
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const proposalId = response.notification.request.content.data?.proposalId;
    if (typeof proposalId === "string") {
      onProposalTapped(proposalId);
    }
  });
}
