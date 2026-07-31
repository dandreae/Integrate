import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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
import type { Place } from "@/types";
import { Badge } from "@/components/Badge";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { useSavedPlacesStore } from "@/store/useSavedPlacesStore";
import { getAccessibilitySummary } from "./accessibilitySummary";
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

  const { height: windowHeight } = useWindowDimensions();
  const panelHeight = windowHeight / 3;

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
          </ScrollView>

          <Pressable
            onPress={() => onDirections(place)}
            accessibilityRole="button"
            accessibilityLabel={`Get directions to ${place.officialName}`}
            style={styles.directionsButton}
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
  directionsLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
