import { Ionicons } from "@expo/vector-icons";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { LatLng, Place } from "@/types";
import type { PlaceSearchResult } from "@/services/search";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { getAccessibilitySummary } from "@/features/places/accessibilitySummary";
import { getPlaceTrustSignals } from "@/features/places/dataTrust";
import { getLiveStatus, LIVE_STATUS_LABEL } from "@/features/places/liveStatus";
import { formatDistanceMeters, haversineDistanceMeters } from "@/features/routing/geo";

interface SearchResultsListProps {
  results: PlaceSearchResult[];
  userLocation: LatLng | null;
  onSelectPlace: (place: Place) => void;
}

export function SearchResultsList({ results, userLocation, onSelectPlace }: SearchResultsListProps) {
  if (results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.emptyText}>No places match that search.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.place.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => {
        const { place, matchReason, matchReasons } = item;
        const meta = PLACE_CATEGORY_META[place.category];
        const distanceMeters = userLocation
          ? haversineDistanceMeters(userLocation, { latitude: place.latitude, longitude: place.longitude })
          : null;
        const accessibilitySummary = getAccessibilitySummary(place);
        const hasAccessibleEntrance = place.entrances.some((entrance) => entrance.isAccessible);
        const liveStatus = getLiveStatus(place);
        // Synchronous signals only — fetching reports per visible row isn't worth it here; see PlacePreviewCard for the full picture.
        const trustSignal = getPlaceTrustSignals(place, false)[0];

        return (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 35).duration(220)}>
            <Pressable
              onPress={() => onSelectPlace(place)}
              accessibilityRole="button"
              accessibilityLabel={`${place.officialName}${place.localName ? `, also called ${place.localName}` : ""}`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={[styles.categoryIcon, { backgroundColor: meta.color }]}>
                <Ionicons name={meta.icon} size={16} color={colors.textInverse} />
              </View>

              <View style={styles.rowText}>
                <View style={styles.titleRow}>
                  <Text style={styles.officialName} numberOfLines={1}>
                    {place.officialName}
                  </Text>
                  {!matchReasons && matchReason ? (
                    <View style={styles.matchTag}>
                      <Text style={styles.matchTagLabel}>{matchReason}</Text>
                    </View>
                  ) : null}
                </View>

                {place.localName && (
                  <Text style={styles.localName} numberOfLines={1}>
                    "{place.localName}" · {meta.label}
                    {liveStatus ? ` · ${LIVE_STATUS_LABEL[liveStatus]}` : ""}
                  </Text>
                )}

                <View style={styles.metaRow}>
                  {distanceMeters != null && (
                    <Text style={styles.metaText}>{formatDistanceMeters(distanceMeters)} away</Text>
                  )}
                  <Text
                    style={[styles.metaText, hasAccessibleEntrance && { color: colors.accessible }]}
                    numberOfLines={1}
                  >
                    {accessibilitySummary}
                  </Text>
                </View>

                {matchReasons && (
                  <View style={styles.matchedBecauseCard}>
                    <Text style={styles.matchedBecauseTitle}>Matched because</Text>
                    {matchReasons.map((reason) => (
                      <View key={reason} style={styles.matchedBecauseRow}>
                        <Ionicons name="checkmark-circle" size={13} color={colors.accessible} />
                        <Text style={styles.matchedBecauseText}>{reason}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Pressable>

            {trustSignal && (
              <Pressable
                onPress={() => Alert.alert(trustSignal.label, trustSignal.explanation)}
                accessibilityRole="button"
                accessibilityLabel={`${trustSignal.label}. Tap for details.`}
                style={styles.trustRow}
                hitSlop={4}
              >
                <Ionicons name={trustSignal.icon} size={14} color={colors.warning} />
                <Text style={styles.trustText} numberOfLines={1}>
                  {trustSignal.label}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...shadow.floating,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rowText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  officialName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  matchTag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  matchTagLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  localName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  matchedBecauseCard: {
    backgroundColor: colors.accessibleMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: spacing.xs,
    gap: 2,
  },
  matchedBecauseTitle: {
    ...typography.label,
    color: colors.accessible,
    marginBottom: 2,
  },
  matchedBecauseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  matchedBecauseText: {
    ...typography.caption,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingLeft: 32 + spacing.sm + spacing.md,
    paddingBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  trustText: {
    ...typography.caption,
    color: colors.warning,
    flexShrink: 1,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    ...shadow.floating,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
