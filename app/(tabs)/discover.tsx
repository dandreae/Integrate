import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { ExploreCampusCard } from "@/features/places/ExploreCampusCard";
import { ReportDevTools } from "@/features/reports/ReportDevTools";

export default function DiscoverScreen() {
  const [devToolsUnlocked, setDevToolsUnlocked] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Long-press to reveal dev tools in development builds — never a
            visible affordance, so it never reads as a developer tool during
            a demo. */}
        <Pressable
          onLongPress={() => __DEV__ && setDevToolsUnlocked((prev) => !prev)}
          delayLongPress={1500}
          style={styles.emptyState}
        >
          <Ionicons name="compass-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.title}>Discover is coming soon</Text>
          <Text style={styles.body}>
            Restaurants, coffee shops, study spots, and what's happening on campus this week will
            live here.
          </Text>
        </Pressable>

        <View style={styles.cardWrapper}>
          <Pressable
            onPress={() => router.push("/first-day")}
            accessibilityRole="button"
            accessibilityLabel="Retake the First Day campus tour"
            style={({ pressed }) => [styles.tourCard, pressed && styles.tourCardPressed]}
          >
            <View style={styles.tourIcon}>
              <Text style={styles.tourEmoji}>📍</Text>
            </View>
            <View style={styles.tourText}>
              <Text style={styles.tourTitle}>First Day on Campus</Text>
              <Text style={styles.tourBody}>Retake the guided tour of campus essentials.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.statsSpacer}>
            <ExploreCampusCard />
          </View>
        </View>

        {__DEV__ && devToolsUnlocked && <ReportDevTools />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    alignItems: "center",
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
  cardWrapper: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  tourCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  tourCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  tourIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  tourEmoji: {
    fontSize: 20,
  },
  tourText: {
    flex: 1,
  },
  tourTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  tourBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsSpacer: {
    marginTop: spacing.md,
  },
});
