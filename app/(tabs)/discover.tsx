import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/constants/theme";

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="compass-outline" size={40} color={colors.textSecondary} />
      <Text style={styles.title}>Discover is coming soon</Text>
      <Text style={styles.body}>
        Restaurants, coffee shops, study spots, and what's happening on campus this week will live
        here.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
