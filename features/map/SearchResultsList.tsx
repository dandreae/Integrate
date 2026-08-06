import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { Place } from "@/types";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";

interface SearchResultsListProps {
  /** Places from Integrate's own curated data. */
  results: Place[];
  /** Places found via the map/geocoding service — not curated, shown separately and honestly labeled. */
  externalResults: Place[];
  /** Algorithmic "this might be what that abbreviation means" guesses — always unconfirmed, never auto-selected. */
  possibleMatches: Place[];
  isSearchingExternal: boolean;
  onSelect: (place: Place) => void;
}

const MAX_RESULTS = 6;

function ResultRow({
  place,
  onSelect,
  isGuess,
}: {
  place: Place;
  onSelect: (place: Place) => void;
  isGuess?: boolean;
}) {
  const meta = PLACE_CATEGORY_META[place.category];
  return (
    <Pressable
      onPress={() => onSelect(place)}
      accessibilityRole="button"
      accessibilityLabel={isGuess ? `${place.officialName}, unconfirmed guess` : place.officialName}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: meta.color }]}>
        <Ionicons name={isGuess ? "help" : meta.icon} size={16} color={colors.textInverse} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {place.officialName}
        </Text>
        {isGuess ? (
          <Text style={styles.rowGuessSubtext} numberOfLines={1}>
            Possible match — not confirmed
          </Text>
        ) : (
          place.localName && (
            <Text style={styles.rowSubtext} numberOfLines={1}>
              {place.localName}
            </Text>
          )
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

export function SearchResultsList({
  results,
  externalResults,
  possibleMatches,
  isSearchingExternal,
  onSelect,
}: SearchResultsListProps) {
  const hasAny = results.length > 0 || externalResults.length > 0 || possibleMatches.length > 0;

  if (!hasAny && !isSearchingExternal) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No places match your search.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {results.slice(0, MAX_RESULTS).map((place) => (
        <ResultRow key={place.id} place={place} onSelect={onSelect} />
      ))}

      {(externalResults.length > 0 || isSearchingExternal) && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderText}>From the map</Text>
            {isSearchingExternal && <ActivityIndicator size="small" color={colors.textSecondary} />}
          </View>
          {externalResults.slice(0, MAX_RESULTS).map((place) => (
            <ResultRow key={place.id} place={place} onSelect={onSelect} />
          ))}
        </>
      )}

      {possibleMatches.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderText}>Possibly what you mean</Text>
          </View>
          {possibleMatches.slice(0, MAX_RESULTS).map((place) => (
            <ResultRow key={place.id} place={place} onSelect={onSelect} isGuess />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadow.floating,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget.minimum,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  rowSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rowGuessSubtext: {
    ...typography.caption,
    color: colors.warning,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  sectionHeaderText: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
