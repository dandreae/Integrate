import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Place } from "@/types";
import { Badge } from "@/components/Badge";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { placeRepository } from "@/services/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useSavedPlacesStore } from "@/store/useSavedPlacesStore";

export default function SavedScreen() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const savedPlaceIds = useSavedPlacesStore((state) => state.savedPlaceIds);
  const toggleSaved = useSavedPlacesStore((state) => state.toggleSaved);
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
  }, [selectedCampusId]);

  const savedPlaces = places.filter((place) => savedPlaceIds.includes(place.id));

  if (savedPlaces.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={40} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>No saved places yet</Text>
        <Text style={styles.emptyBody}>
          Tap the bookmark icon on any place to save it here for quick access later.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.header}>Saved places</Text>
      <FlatList
        data={savedPlaces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const meta = PLACE_CATEGORY_META[item.category];
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(220)} style={styles.card}>
              <Pressable
                onPress={() => router.push({ pathname: "/place/[id]", params: { id: item.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Open details for ${item.officialName}`}
                style={({ pressed }) => [styles.cardTouchable, pressed && styles.cardPressed]}
              >
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.officialName}</Text>
                  {item.localName && <Text style={styles.cardSubtitle}>"{item.localName}"</Text>}
                  <View style={styles.badgeRow}>
                    <Badge label={meta.label} icon={meta.icon} tone="accent" />
                  </View>
                </View>
              </Pressable>
              <Pressable
                onPress={() => toggleSaved(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.officialName} from saved places`}
                hitSlop={8}
                style={styles.removeButton}
              >
                <Ionicons name="bookmark" size={22} color={colors.accent} />
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    ...typography.h2,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    ...shadow.card,
  },
  cardTouchable: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  removeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
