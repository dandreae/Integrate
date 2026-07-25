import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { Place, RoutePreference } from "@/types";
import { ROUTE_PREFERENCE_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { placeRepository } from "@/services/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useDirectionsStore, type RouteOriginSelection } from "@/store/useDirectionsStore";

const PREFERENCES: RoutePreference[] = ["fastest", "accessible", "avoidConstruction"];

type ActiveField = "origin" | "destination" | null;

export default function RoutePlannerScreen() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const requestRoute = useDirectionsStore((state) => state.requestRoute);

  const [places, setPlaces] = useState<Place[]>([]);
  const [originSelection, setOriginSelection] = useState<RouteOriginSelection>({
    type: "currentLocation",
  });
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(null);
  const [preference, setPreference] = useState<RoutePreference>("fastest");
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
  }, [selectedCampusId]);

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return places;
    return places.filter(
      (place) =>
        place.officialName.toLowerCase().includes(normalized) ||
        place.localName?.toLowerCase().includes(normalized)
    );
  }, [places, query]);

  const originLabel =
    originSelection.type === "currentLocation"
      ? "My Location"
      : places.find((place) => place.id === originSelection.placeId)?.officialName ?? "Choose a starting point";

  const destinationLabel =
    places.find((place) => place.id === destinationPlaceId)?.officialName ?? "Choose a destination";

  function openField(field: ActiveField) {
    setQuery("");
    setActiveField(field);
  }

  function selectPlace(place: Place) {
    if (activeField === "origin") {
      setOriginSelection({ type: "place", placeId: place.id });
    } else if (activeField === "destination") {
      setDestinationPlaceId(place.id);
    }
    setActiveField(null);
  }

  function selectMyLocation() {
    setOriginSelection({ type: "currentLocation" });
    setActiveField(null);
  }

  function handlePreview() {
    if (!destinationPlaceId) return;
    requestRoute({ origin: originSelection, destinationPlaceId, preference });
    router.back();
  }

  if (activeField) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.pickerHeader}>
          <Pressable
            onPress={() => setActiveField(null)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            hitSlop={8}
            style={styles.pickerBackButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.searchField}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={activeField === "origin" ? "Search starting point..." : "Search destination..."}
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              accessibilityLabel="Search campus places"
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </SafeAreaView>

        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.pickerListContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            activeField === "origin" ? (
              <Pressable
                onPress={selectMyLocation}
                accessibilityRole="button"
                accessibilityLabel="Use my current location"
                style={styles.pickerRow}
              >
                <Ionicons name="locate" size={20} color={colors.accent} style={styles.pickerRowIcon} />
                <Text style={styles.pickerRowTitle}>My Location</Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => selectPlace(item)}
              accessibilityRole="button"
              accessibilityLabel={item.officialName}
              style={styles.pickerRow}
            >
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.pickerRowIcon} />
              <View>
                <Text style={styles.pickerRowTitle}>{item.officialName}</Text>
                {item.localName && <Text style={styles.pickerRowSubtitle}>"{item.localName}"</Text>}
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Plan a route</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close route planner"
          hitSlop={8}
          style={styles.headerCloseButton}
        >
          <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
        </Pressable>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.fieldGroup}>
          <Pressable
            onPress={() => openField("origin")}
            accessibilityRole="button"
            accessibilityLabel={`Starting point: ${originLabel}. Tap to change.`}
            style={styles.field}
          >
            <View style={[styles.fieldDot, styles.fieldDotOrigin]} />
            <View style={styles.fieldTextWrap}>
              <Text style={styles.fieldLabel}>From</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {originLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.fieldDivider} />

          <Pressable
            onPress={() => openField("destination")}
            accessibilityRole="button"
            accessibilityLabel={`Destination: ${destinationLabel}. Tap to change.`}
            style={styles.field}
          >
            <View style={[styles.fieldDot, styles.fieldDotDestination]} />
            <View style={styles.fieldTextWrap}>
              <Text style={styles.fieldLabel}>To</Text>
              <Text style={[styles.fieldValue, !destinationPlaceId && styles.fieldValuePlaceholder]} numberOfLines={1}>
                {destinationLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Route preference</Text>
        <View style={styles.chipRow}>
          {PREFERENCES.map((option) => {
            const meta = ROUTE_PREFERENCE_META[option];
            const active = preference === option;
            return (
              <Pressable
                key={option}
                onPress={() => setPreference(option)}
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

        <Text style={styles.disclaimer}>
          Routes are simulated for this demo — distances, timing, and turn-by-turn steps are
          approximated, not live GPS navigation.
        </Text>
      </View>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Pressable
          onPress={handlePreview}
          disabled={!destinationPlaceId}
          accessibilityRole="button"
          accessibilityLabel="Preview route"
          style={({ pressed }) => [
            styles.previewButton,
            !destinationPlaceId && styles.previewButtonDisabled,
            pressed && styles.previewButtonPressed,
          ]}
        >
          <Text style={styles.previewButtonLabel}>Preview route</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerCloseButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  fieldGroup: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    ...shadow.card,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 60,
  },
  fieldDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 12 + spacing.sm,
  },
  fieldDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fieldDotOrigin: {
    backgroundColor: colors.accent,
  },
  fieldDotDestination: {
    backgroundColor: colors.danger,
  },
  fieldTextWrap: {
    flex: 1,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fieldValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: 1,
  },
  fieldValuePlaceholder: {
    color: colors.textSecondary,
    fontWeight: "400",
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
  disclaimer: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  previewButton: {
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  previewButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  previewButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  previewButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pickerBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: "100%",
  },
  pickerListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerRowIcon: {
    width: 24,
  },
  pickerRowTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  pickerRowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
