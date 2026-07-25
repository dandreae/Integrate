import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CampusReport, Place } from "@/types";
import { Badge } from "@/components/Badge";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { reportRepository } from "@/services/repositories";
import { useSavedPlacesStore } from "@/store/useSavedPlacesStore";
import { getAccessibilitySummary } from "./accessibilitySummary";
import { getPlaceTrustSignals, hasActiveAccessibilityReport } from "./dataTrust";
import { getLiveStatus, LIVE_STATUS_LABEL } from "./liveStatus";
import { formatDistanceMeters } from "@/features/routing/geo";

const DISMISS_THRESHOLD = 90;
const DISMISS_VELOCITY = 800;

interface PlacePreviewCardProps {
  place: Place;
  distanceMeters: number | null;
  onClose: () => void;
  onOpenDetail: (place: Place) => void;
  onDirections: (place: Place) => void;
}

export function PlacePreviewCard({
  place,
  distanceMeters,
  onClose,
  onOpenDetail,
  onDirections,
}: PlacePreviewCardProps) {
  const isSaved = useSavedPlacesStore((state) => state.isSaved(place.id));
  const toggleSaved = useSavedPlacesStore((state) => state.toggleSaved);
  const meta = PLACE_CATEGORY_META[place.category];
  const accessibilitySummary = getAccessibilitySummary(place);
  const hasAccessibleEntrance = place.entrances.some((entrance) => entrance.isAccessible);
  const liveStatus = getLiveStatus(place);
  const insiderTip = place.studentTips[0];

  const [relatedReports, setRelatedReports] = useState<CampusReport[]>([]);

  useEffect(() => {
    let cancelled = false;
    const entranceIds = new Set(place.entrances.map((entrance) => entrance.id));

    reportRepository.getAllReports().then((allReports) => {
      if (cancelled) return;
      setRelatedReports(
        allReports.filter(
          (report) =>
            (report.relatedEntity.type === "place" && report.relatedEntity.id === place.id) ||
            (report.relatedEntity.type === "entrance" && entranceIds.has(report.relatedEntity.id))
        )
      );
    });

    return () => {
      cancelled = true;
    };
  }, [place]);

  const trustSignals = getPlaceTrustSignals(place, hasActiveAccessibilityReport(relatedReports));

  function handleDirectionsPress() {
    if (trustSignals.length === 0) {
      onDirections(place);
      return;
    }
    Alert.alert(
      "Before you go",
      `${trustSignals.map((signal) => signal.explanation).join("\n\n")}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Get directions anyway", onPress: () => onDirections(place) },
      ]
    );
  }

  const translateY = useSharedValue(0);

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function close() {
    onClose();
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (translateY.value > DISMISS_THRESHOLD || event.velocityY > DISMISS_VELOCITY) {
        translateY.value = withTiming(400, { duration: 150 });
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 18 });
      }
    });

  return (
    <Animated.View
      style={styles.wrapper}
      entering={SlideInDown.springify().damping(20)}
      accessibilityViewIsModal
    >
      <Animated.View style={dragStyle}>
        <SafeAreaView edges={["bottom"]} style={styles.card}>
          <GestureDetector gesture={panGesture}>
            <View style={styles.dragZone}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          <View style={styles.headerRow}>
            <Pressable
              style={styles.headerText}
              onPress={() => onOpenDetail(place)}
              accessibilityRole="button"
              accessibilityLabel={`Open full details for ${place.officialName}`}
            >
              <Text style={styles.officialName}>{place.officialName}</Text>
              {place.localName && (
                <Text style={styles.localName}>Students call it "{place.localName}"</Text>
              )}
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => toggleSaved(place.id)}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? "Remove from saved places" : "Save this place"}
                accessibilityState={{ selected: isSaved }}
                hitSlop={8}
                style={styles.headerActionButton}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={isSaved ? colors.accent : colors.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close place preview"
                hitSlop={8}
                style={styles.headerActionButton}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => onOpenDetail(place)}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${place.officialName}`}
          >
            <View style={styles.badgeRow}>
              <Badge label={meta.label} icon={meta.icon} tone="accent" />
              {hasAccessibleEntrance && (
                <Badge label="Accessible entrance" icon="accessibility-outline" tone="accessible" />
              )}
              {liveStatus && (
                <Badge
                  label={LIVE_STATUS_LABEL[liveStatus]}
                  icon={liveStatus === "busy" ? "people-outline" : "moon-outline"}
                  tone={liveStatus === "busy" ? "warning" : "neutral"}
                />
              )}
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {place.description}
            </Text>

            {insiderTip && (
              <View style={styles.insiderTip}>
                <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                <Text style={styles.insiderTipText} numberOfLines={2}>
                  {insiderTip}
                </Text>
              </View>
            )}

            <View style={styles.metaRow}>
              {distanceMeters != null && (
                <View style={styles.metaItem}>
                  <Ionicons name="walk-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{formatDistanceMeters(distanceMeters)} away</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {place.openingHours.summary}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Ionicons
                name={hasAccessibleEntrance ? "accessibility-outline" : "information-circle-outline"}
                size={16}
                color={hasAccessibleEntrance ? colors.accessible : colors.textSecondary}
              />
              <Text
                style={[
                  styles.metaText,
                  hasAccessibleEntrance && { color: colors.accessible },
                ]}
                numberOfLines={1}
              >
                {accessibilitySummary}
              </Text>
            </View>
          </Pressable>

          {trustSignals.length > 0 && (
            <Pressable
              onPress={() => Alert.alert(trustSignals[0].label, trustSignals[0].explanation)}
              accessibilityRole="button"
              accessibilityLabel={`${trustSignals[0].label}. Tap for details.`}
              style={styles.trustRow}
              hitSlop={4}
            >
              <Ionicons name={trustSignals[0].icon} size={16} color={colors.warning} />
              <Text style={styles.trustText} numberOfLines={1}>
                {trustSignals[0].label}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleDirectionsPress}
            accessibilityRole="button"
            accessibilityLabel={`Get directions to ${place.officialName}`}
            style={({ pressed }) => [
              styles.directionsButton,
              pressed && styles.directionsButtonPressed,
            ]}
          >
            <Ionicons name="navigate-outline" size={18} color={colors.textInverse} />
            <Text style={styles.directionsLabel}>Directions</Text>
          </Pressable>
        </SafeAreaView>
      </Animated.View>
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
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    ...shadow.floating,
  },
  dragZone: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  officialName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  localName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerActionButton: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  insiderTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: colors.accentMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: spacing.sm,
  },
  insiderTipText: {
    ...typography.caption,
    color: colors.accent,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  trustText: {
    ...typography.caption,
    color: colors.warning,
    flexShrink: 1,
  },
  directionsButton: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
  },
  directionsButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  directionsLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
