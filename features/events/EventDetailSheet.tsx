import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CampusEvent } from "@/types";
import { Badge } from "@/components/Badge";
import { EVENT_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { formatRelativeEventDate } from "./eventDate";

interface EventDetailSheetProps {
  event: CampusEvent | null;
  placeName: string | null;
  onClose: () => void;
  onGetDirections: () => void;
}

const POPULARITY_LABEL: Record<CampusEvent["expectedPopularity"], string> = {
  low: "Small turnout expected",
  medium: "Moderate turnout expected",
  high: "Big turnout expected",
};

export function EventDetailSheet({ event, placeName, onClose, onGetDirections }: EventDetailSheetProps) {
  const visible = event !== null;
  if (!event) return null;

  const meta = EVENT_CATEGORY_META[event.category];
  const relativeDate = formatRelativeEventDate(event.date);
  const isToday = relativeDate === "Today";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.badgeRow}>
          <Badge label={meta.label} icon={meta.icon} tone="accent" />
          <View style={[styles.dateBadge, isToday && styles.dateBadgeToday]}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={isToday ? colors.textInverse : colors.textSecondary}
            />
            <Text style={[styles.dateBadgeText, isToday && styles.dateBadgeTextToday]}>{relativeDate}</Text>
          </View>
        </View>

        {placeName && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>{placeName}</Text>
          </View>
        )}

        <Text style={styles.popularityText}>{POPULARITY_LABEL[event.expectedPopularity]}</Text>

        <Pressable
          onPress={onGetDirections}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${event.title}`}
          style={styles.directionsButton}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.textInverse} />
          <Text style={styles.directionsLabel}>Directions</Text>
        </Pressable>
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
    ...shadow.floating,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  dateBadgeToday: {
    backgroundColor: colors.danger,
  },
  dateBadgeText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  dateBadgeTextToday: {
    color: colors.textInverse,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  locationText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  popularityText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
