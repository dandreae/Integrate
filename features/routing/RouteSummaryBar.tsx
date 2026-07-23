import { Ionicons } from "@expo/vector-icons";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Route } from "@/types";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { formatDistanceMeters, formatDurationMinutes } from "./geo";

interface RouteSummaryBarProps {
  destinationName: string;
  route: Route;
  onClose: () => void;
}

const WARNING_SEVERITY_TONE: Record<Route["warnings"][number]["severity"], string> = {
  info: colors.textSecondary,
  caution: colors.warning,
  high: colors.danger,
};

export function RouteSummaryBar({ destinationName, route, onClose }: RouteSummaryBarProps) {
  const topWarning = route.warnings[0];

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18)}
      exiting={SlideOutDown.duration(150)}
      style={styles.wrapper}
    >
      <SafeAreaView edges={["bottom"]} style={styles.bar}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              Directions to {destinationName}
            </Text>
            <Text style={styles.subtitle}>
              {formatDistanceMeters(route.distanceMeters)} · {formatDurationMinutes(route.durationMinutes)} walk
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Clear directions"
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {topWarning && (
          <View style={styles.warningRow}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={WARNING_SEVERITY_TONE[topWarning.severity]}
            />
            <Text style={[styles.warningText, { color: WARNING_SEVERITY_TONE[topWarning.severity] }]}>
              {topWarning.label}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    ...shadow.floating,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    alignItems: "center",
    justifyContent: "center",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  warningText: {
    ...typography.caption,
  },
});
