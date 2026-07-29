import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { colors } from "@/constants/theme";
import { useUserStore } from "@/store/useUserStore";

export default function RootLayout() {
  const bootstrapAuth = useUserStore((state) => state.bootstrapAuth);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

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
