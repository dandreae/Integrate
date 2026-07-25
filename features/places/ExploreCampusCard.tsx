import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Place, PlaceCategory } from "@/types";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { placeRepository } from "@/services/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useExploredStore } from "@/store/useExploredStore";

const TRACKED_CATEGORIES: { category: PlaceCategory; label: string }[] = [
  { category: "landmark", label: "landmarks" },
  { category: "study", label: "study spots" },
  { category: "coffee", label: "coffee shops" },
];

/** Demo-polish only — reflects back what a student has looked at so far. */
export function ExploreCampusCard() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const exploredPlaceIds = useExploredStore((state) => state.exploredPlaceIds);
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
  }, [selectedCampusId]);

  const explored = places.filter((place) => exploredPlaceIds.includes(place.id));

  if (explored.length === 0) {
    return (
      <View style={styles.card}>
        <Ionicons name="compass-outline" size={22} color={colors.accent} />
        <Text style={styles.title}>Start exploring campus</Text>
        <Text style={styles.body}>
          Tap places on the map to start tracking what you've discovered.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>You've explored</Text>
      {TRACKED_CATEGORIES.map(({ category, label }) => {
        const count = explored.filter((place) => place.category === category).length;
        if (count === 0) return null;
        const meta = PLACE_CATEGORY_META[category];
        return (
          <View key={category} style={styles.row}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accessible} />
            <Ionicons name={meta.icon} size={14} color={colors.textSecondary} style={styles.rowIcon} />
            <Text style={styles.rowText}>
              {count} {label}
            </Text>
          </View>
        );
      })}
      <Text style={styles.footer}>{explored.length} places explored in total</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowIcon: {
    marginLeft: 2,
  },
  rowText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  footer: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
