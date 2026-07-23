import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, Stack } from "expo-router";
import { colors } from "@/constants/theme";
import { useUserStore } from "@/store/useUserStore";
import {
  addProposalNotificationResponseListener,
  registerForPushNotificationsAsync,
} from "@/services/pushNotifications";

export default function RootLayout() {
  const uid = useUserStore((state) => state.uid);
  const bootstrapAuth = useUserStore((state) => state.bootstrapAuth);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  useEffect(() => {
    if (!uid) return;
    registerForPushNotificationsAsync(uid).catch((error) => {
      console.error("Failed to register for push notifications", error);
    });
  }, [uid]);

  useEffect(() => {
    const subscription = addProposalNotificationResponseListener((proposalId) => {
      router.push({ pathname: "/proposal/[id]", params: { id: proposalId } });
    });
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="place/[id]" options={{ presentation: "modal" }} />
          <Stack.Screen name="proposal/[id]" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
