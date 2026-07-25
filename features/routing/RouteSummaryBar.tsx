import { Ionicons } from "@expo/vector-icons";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Route } from "@/types";
import { ROUTE_PREFERENCE_META, ROUTE_WARNING_SEVERITY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { REPORT_ISSUE_TYPE_META } from "@/features/reports/reportMeta";
import type { RelevantRouteReport } from "@/services/reports/RouteReportEvaluator";
import { formatDistanceMeters, formatDurationMinutes } from "./geo";

interface RouteSummaryBarProps {
  destinationName: string;
  route: Route;
  relevantReports: RelevantRouteReport[];
  onPress: () => void;
  onClose: () => void;
}

export function RouteSummaryBar({
  destinationName,
  route,
  relevantReports,
  onPress,
  onClose,
}: RouteSummaryBarProps) {
  const topHighSeverityReport = relevantReports.find((entry) => entry.report.severity === "high");
  const topWarning = route.warnings[0];
  const preferenceMeta = ROUTE_PREFERENCE_META[route.preference];

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18)}
      exiting={SlideOutDown.duration(150)}
      style={styles.wrapper}
    >
      <SafeAreaView edges={["bottom"]} style={styles.bar}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Open route overview to ${destinationName}`}
            style={styles.headerTouchable}
          >
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Ionicons name={preferenceMeta.icon} size={14} color={preferenceMeta.color} />
                <Text style={styles.title} numberOfLines={1}>
                  Directions to {destinationName}
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {formatDistanceMeters(route.distanceMeters)} · {formatDurationMinutes(route.durationMinutes)} walk ·{" "}
                {preferenceMeta.label}
              </Text>
            </View>
            <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
          </Pressable>
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

        {topHighSeverityReport ? (
          <View style={styles.warningRow}>
            <Ionicons name="flag" size={16} color={colors.danger} />
            <Text style={[styles.warningText, { color: colors.danger }]} numberOfLines={1}>
              Unverified report: {REPORT_ISSUE_TYPE_META[topHighSeverityReport.report.issueType].label}
            </Text>
          </View>
        ) : (
          topWarning && (
            <View style={styles.warningRow}>
              <Ionicons
                name={ROUTE_WARNING_SEVERITY_META[topWarning.severity].icon}
                size={16}
                color={ROUTE_WARNING_SEVERITY_META[topWarning.severity].color}
              />
              <Text
                style={[styles.warningText, { color: ROUTE_WARNING_SEVERITY_META[topWarning.severity].color }]}
                numberOfLines={1}
              >
                {ROUTE_WARNING_SEVERITY_META[topWarning.severity].label}: {topWarning.label}
              </Text>
            </View>
          )
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
  headerTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
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
    flex: 1,
  },
});
