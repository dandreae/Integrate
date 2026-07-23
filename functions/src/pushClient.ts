import { Expo, type ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

/** Sends push messages in Expo's required chunks; logs (doesn't throw on) per-chunk failures. */
export async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<void> {
  const validMessages = messages.filter((message) => Expo.isExpoPushToken(message.to));
  if (validMessages.length === 0) return;

  const chunks = expo.chunkPushNotifications(validMessages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Failed to send a push notification chunk", error);
    }
  }
}
