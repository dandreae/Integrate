import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";

const ICON_SIZE = 30;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 50 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarAccessibilityLabel: "Map",
          tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarAccessibilityLabel: "Discover",
          tabBarIcon: ({ color }) => <Ionicons name="compass-outline" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarAccessibilityLabel: "Friends",
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarAccessibilityLabel: "Saved",
          tabBarIcon: ({ color }) => <Ionicons name="bookmark-outline" size={ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
}
