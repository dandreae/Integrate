import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Route, RoutePreference } from "@/types";
import { PLACE_CATEGORY_META, ROUTE_PREFERENCE_META, ROUTE_WARNING_SEVERITY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import type { AlternativeRouteSuggestion, RelevantRouteReport } from "@/services/reports/RouteReportEvaluator";
import { formatDistanceMeters, formatDurationMinutes } from "./geo";
import type { PassedPlace } from "./routePassesBy";
import { RouteReportedConditions } from "./RouteReportedConditions";

const PREFERENCES: RoutePreference[] = ["fastest", "accessible", "avoidConstruction"];

interface RouteOverviewSheetProps {
  visible: boolean;
  route: Route | null;
  destinationName: string;
  passedPlaces: PassedPlace[];
  relevantReports: RelevantRouteReport[];
  alternativeSuggestion: AlternativeRouteSuggestion | null;
  onChangePreference: (preference: RoutePreference) => void;
  onClose: () => void;
  onClearRoute: () => void;
  onReportIssue: () => void;
  onFindAlternativeRoute: () => void;
  onOpenPassedPlace: (place: PassedPlace["place"]) => void;
}

function formatEta(durationMinutes: number): string {
  const arrival = new Date(Date.now() + durationMinutes * 60 * 1000);
  return arrival.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function wasReroutedForConstruction(route: Route): boolean {
  return (
    route.preference === "avoidConstruction" &&
    route.warnings.some(
      (warning) => warning.type === "construction" && warning.label === "Rerouted around construction"
    )
  );
}

export function RouteOverviewSheet({
  visible,
  route,
  destinationName,
  passedPlaces,
  relevantReports,
  alternativeSuggestion,
  onChangePreference,
  onClose,
  onClearRoute,
  onReportIssue,
  onFindAlternativeRoute,
  onOpenPassedPlace,
}: RouteOverviewSheetProps) {
  if (!route) return null;

  const reroutedForConstruction = wasReroutedForConstruction(route);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close route overview" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            Directions to {destinationName}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Collapse route overview"
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            Simulated route for demo purposes — not live GPS turn-by-turn navigation.
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {PREFERENCES.map((preference) => {
              const meta = ROUTE_PREFERENCE_META[preference];
              const active = route.preference === preference;
              return (
                <Pressable
                  key={preference}
                  onPress={() => onChangePreference(preference)}
                  accessibilityRole="button"
                  accessibilityLabel={meta.label}
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && { backgroundColor: meta.color }]}
                >
                  <Ionicons name={meta.icon} size={16} color={active ? colors.textInverse : colors.textPrimary} />
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{meta.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="walk-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.statText}>{formatDistanceMeters(route.distanceMeters)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.statText}>{formatDurationMinutes(route.durationMinutes)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flag-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.statText}>Arrive {formatEta(route.durationMinutes)}</Text>
            </View>
          </View>

          <View style={styles.weatherRow}>
            <Text style={styles.weatherEmoji}>☀️</Text>
            <Text style={styles.weatherText}>68°F — good day for a walk</Text>
          </View>

          {passedPlaces.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>You'll pass</Text>
              <View style={styles.passedByRow}>
                {passedPlaces.map(({ place }) => {
                  const passedMeta = PLACE_CATEGORY_META[place.category];
                  return (
                    <Pressable
                      key={place.id}
                      onPress={() => onOpenPassedPlace(place)}
                      accessibilityRole="button"
                      accessibilityLabel={`${place.officialName}. Tap for details.`}
                      style={styles.passedByChip}
                    >
                      <Ionicons name={passedMeta.icon} size={14} color={passedMeta.color} />
                      <Text style={styles.passedByLabel} numberOfLines={1}>
                        {place.localName ?? place.officialName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {reroutedForConstruction && (
            <View style={styles.narrativeBanner}>
              <Ionicons name="construct" size={18} color={colors.warning} />
              <Text style={styles.narrativeBannerText}>
                We found construction ahead — here's a route around it.
              </Text>
            </View>
          )}

          {route.accessibleEntranceLabel && (
            <View style={styles.entranceBanner}>
              <Ionicons name="accessibility-outline" size={18} color={colors.accessible} />
              <Text style={styles.entranceBannerText}>
                We found an accessible entrance — routing you via "{route.accessibleEntranceLabel}".
              </Text>
            </View>
          )}

          {alternativeSuggestion && (
            <View style={styles.alternativeBanner}>
              <View style={styles.alternativeBannerHeader}>
                <Ionicons name="warning" size={18} color={colors.danger} />
                <Text style={styles.alternativeBannerTitle}>High-severity report on this route</Text>
              </View>
              <Text style={styles.alternativeBannerText}>{alternativeSuggestion.reason}</Text>
              <Pressable
                onPress={onFindAlternativeRoute}
                accessibilityRole="button"
                accessibilityLabel="Find another route"
                style={({ pressed }) => [styles.alternativeButton, pressed && styles.buttonPressed]}
              >
                <Ionicons name="shuffle-outline" size={16} color={colors.textInverse} />
                <Text style={styles.alternativeButtonLabel}>Find another route</Text>
              </Pressable>
            </View>
          )}

          <RouteReportedConditions relevantReports={relevantReports} />

          {route.warnings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route notes</Text>
              {route.warnings.map((warning, index) => {
                const severityMeta = ROUTE_WARNING_SEVERITY_META[warning.severity];
                return (
                  <View key={`${warning.type}-${index}`} style={styles.warningRow}>
                    <Ionicons name={severityMeta.icon} size={18} color={severityMeta.color} style={styles.warningIcon} />
                    <View style={styles.warningTextWrap}>
                      <Text style={[styles.warningLabel, { color: severityMeta.color }]}>
                        {severityMeta.label}: {warning.label}
                      </Text>
                      <Text style={styles.warningDescription}>{warning.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Simulated directions</Text>
            {route.steps.map((step, index) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeLabel}>{index + 1}</Text>
                </View>
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onReportIssue}
            accessibilityRole="button"
            accessibilityLabel="Report an issue with this route"
            style={({ pressed }) => [styles.clearButton, styles.actionButton, pressed && styles.buttonPressed]}
          >
            <Ionicons name="flag-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.clearButtonLabel}>Report an issue</Text>
          </Pressable>
          <Pressable
            onPress={onClearRoute}
            accessibilityRole="button"
            accessibilityLabel="Clear directions"
            style={({ pressed }) => [styles.clearButton, styles.actionButton, pressed && styles.buttonPressed]}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.clearButtonLabel}>Clear route</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    maxHeight: "85%",
    ...shadow.floating,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    minHeight: 44,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  chipLabelActive: {
    color: colors.textInverse,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  weatherEmoji: {
    fontSize: 16,
  },
  weatherText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  passedByRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  passedByChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    maxWidth: 180,
  },
  passedByLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  narrativeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  narrativeBannerText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
  },
  entranceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accessibleMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  entranceBannerText: {
    ...typography.caption,
    color: colors.accessible,
    flex: 1,
  },
  alternativeBanner: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alternativeBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  alternativeBannerTitle: {
    ...typography.bodyStrong,
    color: colors.danger,
    flex: 1,
  },
  alternativeBannerText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  alternativeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
    marginTop: spacing.sm,
  },
  alternativeButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  warningRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningTextWrap: {
    flex: 1,
  },
  warningLabel: {
    ...typography.bodyStrong,
  },
  warningDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeLabel: {
    ...typography.label,
    color: colors.accent,
  },
  stepTextWrap: {
    flex: 1,
    justifyContent: "center",
  },
  stepInstruction: {
    ...typography.body,
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    marginTop: 0,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.sm,
  },
  clearButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
});
