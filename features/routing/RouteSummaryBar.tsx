import { Ionicons } from "@expo/vector-icons";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RouteOption, RoutePreference } from "@/types";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { formatDistanceMeters, formatDurationMinutes } from "./geo";

interface RouteSummaryBarProps {
  destinationName: string;
  /** Name of the chosen starting place, when routing building-to-building instead of from the user's location. */
  originName?: string | null;
  routeOptions: RouteOption[];
  selectedPreference: RoutePreference;
  onSelectPreference: (preference: RoutePreference) => void;
  onClose: () => void;
  onOpenAccessibilityPreferences: () => void;
}

const WARNING_SEVERITY_TONE: Record<string, string> = {
  info: colors.textSecondary,
  caution: colors.warning,
  high: colors.danger,
};

const SOURCE_LABEL: Record<string, string> = {
  mock: "Simulated route — not based on real paths. Live routing unavailable.",
  fixture: "Demo route (cached from a real route) — live routing unavailable",
};

export function RouteSummaryBar({
  destinationName,
  originName,
  routeOptions,
  selectedPreference,
  onSelectPreference,
  onClose,
  onOpenAccessibilityPreferences,
}: RouteSummaryBarProps) {
  const selected = routeOptions.find((o) => o.preference === selectedPreference) ?? routeOptions[0];
  const selectedRoute = selected?.route ?? null;
  const topWarning = selectedRoute?.warnings[0];
  const sourceLabel = selectedRoute ? SOURCE_LABEL[selectedRoute.source] : undefined;

  return (
    <Animated.View
      entering={SlideInDown.duration(220)}
      exiting={SlideOutDown.duration(150)}
      style={styles.wrapper}
    >
      <SafeAreaView edges={["bottom"]} style={styles.bar}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {originName ? `Directions: ${originName} → ${destinationName}` : `Directions to ${destinationName}`}
          </Text>
          <Pressable
            onPress={onOpenAccessibilityPreferences}
            accessibilityRole="button"
            accessibilityLabel="Accessibility routing preferences"
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
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

        <View style={styles.optionsRow}>
          {routeOptions.map((option) => {
            const isSelected = option.preference === selectedPreference;
            const isAvailable = option.route !== null;
            return (
              <Pressable
                key={option.preference}
                onPress={() => isAvailable && onSelectPreference(option.preference)}
                disabled={!isAvailable}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
                accessibilityLabel={`${option.label} route${
                  option.route
                    ? `, ${formatDurationMinutes(option.route.durationMinutes)}, ${formatDistanceMeters(
                        option.route.distanceMeters
                      )}`
                    : ", unavailable"
                }`}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  !isAvailable && styles.optionCardUnavailable,
                ]}
              >
                <Text
                  style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
                {option.route ? (
                  <Text style={[styles.optionMeta, isSelected && styles.optionMetaSelected]}>
                    {formatDurationMinutes(option.route.durationMinutes)} ·{" "}
                    {formatDistanceMeters(option.route.distanceMeters)}
                  </Text>
                ) : (
                  <Text style={styles.optionUnavailable} numberOfLines={2}>
                    Unavailable
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {selectedRoute ? (
          <>
            {sourceLabel && (
              <View style={styles.sourceBanner}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={styles.sourceBannerText}>{sourceLabel}</Text>
              </View>
            )}
            {selected.explanation ? (
              <Text style={styles.reasonsText} numberOfLines={2}>
                {selected.explanation}
              </Text>
            ) : (
              selected.reasons.length > 0 && (
                <Text style={styles.reasonsText} numberOfLines={2}>
                  {selected.reasons.join(" · ")}
                </Text>
              )
            )}
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
          </>
        ) : (
          selected?.unavailableReason && (
            <Text style={styles.unavailableDetailText}>{selected.unavailableReason}</Text>
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
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.md,
  },
  closeButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  optionCard: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: touchTarget.minimum,
  },
  optionCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  optionCardUnavailable: {
    opacity: 0.5,
  },
  optionLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  optionLabelSelected: {
    color: colors.accent,
  },
  optionMeta: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 2,
  },
  optionMetaSelected: {
    color: colors.accent,
  },
  optionUnavailable: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonsText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  sourceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.warningMuted,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  sourceBannerText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "700",
    flex: 1,
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
  unavailableDetailText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
