import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AccessibilityIssueType, AccessibilityReport, Place } from "@/types";
import { ACCESSIBILITY_ISSUE_META } from "@/types";
import { Badge } from "@/components/Badge";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { useSavedPlacesStore } from "@/store/useSavedPlacesStore";
import { getAccessibilitySummary } from "./accessibilitySummary";
import { PlacePickerSheet } from "./PlacePickerSheet";
import { ReportAccessibilityIssueSheet } from "@/features/accessibility/ReportAccessibilityIssueSheet";
import { formatDistanceMeters } from "@/features/routing/geo";

const DISMISS_THRESHOLD = 90;
const DISMISS_VELOCITY = 800;

interface PlacePreviewCardProps {
  place: Place;
  places: Place[];
  distanceMeters: number | null;
  accessibilityReports: AccessibilityReport[];
  onClose: () => void;
  onOpenDetail: (place: Place) => void;
  onDirections: (place: Place) => void;
  onDirectionsFrom: (origin: Place, destination: Place) => void;
  onSubmitAccessibilityReport: (
    place: Place,
    payload: { issueType: AccessibilityIssueType; description: string }
  ) => Promise<void>;
}

export function PlacePreviewCard({
  place,
  places,
  distanceMeters,
  accessibilityReports,
  onClose,
  onOpenDetail,
  onDirections,
  onDirectionsFrom,
  onSubmitAccessibilityReport,
}: PlacePreviewCardProps) {
  const [originPickerVisible, setOriginPickerVisible] = useState(false);
  const [reportSheetVisible, setReportSheetVisible] = useState(false);
  // Places found via the map/geocoding service (see services/geocoding) rather than
  // curated in data/places.ts — there's no full detail page for these to open.
  const isCurated = !place.id.startsWith("osm:");
  const isSaved = useSavedPlacesStore((state) => state.isSaved(place.id));
  const toggleSaved = useSavedPlacesStore((state) => state.toggleSaved);
  const meta = PLACE_CATEGORY_META[place.category];
  const accessibilitySummary = getAccessibilitySummary(place);
  const hasAccessibleEntrance = place.entrances.some((entrance) => entrance.isAccessible);
  const activeReports = accessibilityReports.filter(
    (report) => report.placeId === place.id && report.status === "active"
  );

  const { height: windowHeight } = useWindowDimensions();
  const panelHeight = windowHeight * 0.46;

  const translateY = useSharedValue(0);

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function close() {
    onClose();
  }

  function handleDirectionsPress() {
    Alert.alert(`Directions to ${place.officialName}`, "Start from where?", [
      { text: "My Location", onPress: () => onDirections(place) },
      { text: "Choose starting point...", onPress: () => setOriginPickerVisible(true) },
      { text: "Cancel", style: "cancel" },
    ]);
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
        translateY.value = withTiming(0, { duration: 150 });
      }
    });

  return (
    <Animated.View
      style={[styles.wrapper, { height: panelHeight }]}
      entering={SlideInDown.duration(220)}
      accessibilityViewIsModal
    >
      <Animated.View style={[styles.dragFill, dragStyle]}>
        <SafeAreaView edges={["bottom"]} style={styles.card}>
          <GestureDetector gesture={panGesture}>
            <View style={styles.dragZone}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          <View style={styles.headerRow}>
            <Pressable
              style={styles.headerText}
              onPress={isCurated ? () => onOpenDetail(place) : undefined}
              accessibilityRole={isCurated ? "button" : undefined}
              accessibilityLabel={isCurated ? `Open full details for ${place.officialName}` : undefined}
            >
              <Text style={styles.officialName}>{place.officialName}</Text>
              {place.localName && (
                <Text style={styles.localName}>Students call it "{place.localName}"</Text>
              )}
              {!isCurated && <Text style={styles.mapDataBadge}>From map data</Text>}
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

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.badgeRow}>
              <Badge label={meta.label} icon={meta.icon} tone="accent" />
              {hasAccessibleEntrance && (
                <Badge label="Accessible entrance" icon="accessibility-outline" tone="accessible" />
              )}
            </View>

            <Text style={styles.description}>{place.description}</Text>

            {place.studentTips.length > 0 && (
              <View style={styles.tipBanner}>
                <Ionicons name="bulb-outline" size={16} color={colors.accent} />
                <View style={styles.tipTextGroup}>
                  {place.studentTips.map((tip, index) => (
                    <Text key={index} style={styles.tipBannerText}>
                      {tip}
                    </Text>
                  ))}
                </View>
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
                <Text style={styles.metaText}>{place.openingHours.summary}</Text>
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
                  styles.metaTextWrap,
                  hasAccessibleEntrance && { color: colors.accessible },
                ]}
              >
                {accessibilitySummary}
              </Text>
            </View>

            {activeReports.map((report) => (
              <View key={report.id} style={styles.reportBanner}>
                <Ionicons name={ACCESSIBILITY_ISSUE_META[report.issueType].icon} size={16} color={colors.danger} />
                <Text style={styles.reportBannerText}>
                  {ACCESSIBILITY_ISSUE_META[report.issueType].label}: {report.description}
                </Text>
              </View>
            ))}

            <Pressable
              onPress={() => setReportSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Report an accessibility issue at ${place.officialName}`}
              style={styles.reportButton}
            >
              <Ionicons name="flag-outline" size={16} color={colors.warning} />
              <Text style={styles.reportButtonLabel}>Report an accessibility issue</Text>
            </Pressable>

            {place.websiteUrl && (
              <Pressable
                onPress={() => Linking.openURL(place.websiteUrl!)}
                accessibilityRole="button"
                accessibilityLabel={`Open website for ${place.officialName}`}
                style={styles.websiteButton}
              >
                <Ionicons name="open-outline" size={16} color={colors.accent} />
                <Text style={styles.websiteButtonLabel}>Visit website</Text>
              </Pressable>
            )}
          </ScrollView>

          <Pressable
            onPress={handleDirectionsPress}
            accessibilityRole="button"
            accessibilityLabel={`Get directions to ${place.officialName}`}
            style={styles.directionsButton}
          >
            <Ionicons name="navigate-outline" size={18} color={colors.textInverse} />
            <Text style={styles.directionsLabel}>Directions</Text>
          </Pressable>
        </SafeAreaView>
      </Animated.View>

      <PlacePickerSheet
        visible={originPickerVisible}
        title={`Directions to ${place.officialName} from...`}
        places={places}
        excludePlaceId={place.id}
        onClose={() => setOriginPickerVisible(false)}
        onSelect={(origin) => {
          setOriginPickerVisible(false);
          onDirectionsFrom(origin, place);
        }}
      />

      <ReportAccessibilityIssueSheet
        visible={reportSheetVisible}
        placeName={place.officialName}
        onCancel={() => setReportSheetVisible(false)}
        onSubmit={async (payload) => {
          await onSubmitAccessibilityReport(place, payload);
          setReportSheetVisible(false);
        }}
      />
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
  dragFill: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    ...shadow.floating,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  metaTextWrap: {
    flexShrink: 1,
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
  mapDataBadge: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: 4,
    textTransform: "uppercase",
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
  tipBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.accentMuted,
  },
  tipTextGroup: {
    flex: 1,
    gap: 4,
  },
  tipBannerText: {
    ...typography.caption,
    color: colors.accent,
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
  reportBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerMuted,
  },
  reportBannerText: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningMuted,
    minHeight: touchTarget.minimum,
  },
  reportButtonLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.warning,
  },
  websiteButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  websiteButtonLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.accent,
  },
  directionsButton: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
  },
  directionsLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
