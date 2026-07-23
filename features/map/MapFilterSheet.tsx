import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PlaceCategory } from "@/types";
import {
  ACCESSIBLE_ENTRANCE_META,
  CONSTRUCTION_META,
  MAP_FILTER_CATEGORIES,
  PLACE_CATEGORY_META,
} from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

export interface MapFilterState {
  categories: Set<PlaceCategory>;
  showConstruction: boolean;
  showAccessibleEntrances: boolean;
}

interface MapFilterSheetProps {
  visible: boolean;
  filters: MapFilterState;
  onChange: (filters: MapFilterState) => void;
  onClose: () => void;
}

export function MapFilterSheet({ visible, filters, onChange, onClose }: MapFilterSheetProps) {
  function toggleCategory(category: PlaceCategory) {
    const next = new Set(filters.categories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    onChange({ ...filters, categories: next });
  }

  function resetFilters() {
    onChange({
      categories: new Set(MAP_FILTER_CATEGORIES),
      showConstruction: true,
      showAccessibleEntrances: false,
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Filter map</Text>
          <Pressable onPress={resetFilters} hitSlop={8} accessibilityRole="button">
            <Text style={styles.resetLabel}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Categories</Text>
          <View style={styles.chipGrid}>
            {MAP_FILTER_CATEGORIES.map((category) => {
              const meta = PLACE_CATEGORY_META[category];
              const active = filters.categories.has(category);
              return (
                <Pressable
                  key={category}
                  onPress={() => toggleCategory(category)}
                  accessibilityRole="button"
                  accessibilityLabel={meta.label}
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && { backgroundColor: meta.color }]}
                >
                  <Ionicons
                    name={meta.icon}
                    size={16}
                    color={active ? colors.textInverse : colors.textPrimary}
                  />
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>On the map</Text>
          <View style={styles.chipGrid}>
            <Pressable
              onPress={() => onChange({ ...filters, showConstruction: !filters.showConstruction })}
              accessibilityRole="button"
              accessibilityLabel="Show construction zones"
              accessibilityState={{ selected: filters.showConstruction }}
              style={[
                styles.chip,
                filters.showConstruction && { backgroundColor: CONSTRUCTION_META.color },
              ]}
            >
              <Ionicons
                name={CONSTRUCTION_META.icon}
                size={16}
                color={filters.showConstruction ? colors.textInverse : colors.textPrimary}
              />
              <Text style={[styles.chipLabel, filters.showConstruction && styles.chipLabelActive]}>
                Construction
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onChange({ ...filters, showAccessibleEntrances: !filters.showAccessibleEntrances })
              }
              accessibilityRole="button"
              accessibilityLabel="Show accessible entrances"
              accessibilityState={{ selected: filters.showAccessibleEntrances }}
              style={[
                styles.chip,
                filters.showAccessibleEntrances && { backgroundColor: ACCESSIBLE_ENTRANCE_META.color },
              ]}
            >
              <Ionicons
                name={ACCESSIBLE_ENTRANCE_META.icon}
                size={16}
                color={filters.showAccessibleEntrances ? colors.textInverse : colors.textPrimary}
              />
              <Text
                style={[styles.chipLabel, filters.showAccessibleEntrances && styles.chipLabelActive]}
              >
                Accessible entrances
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Apply filters"
          style={styles.applyButton}
        >
          <Text style={styles.applyLabel}>Show results</Text>
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
    maxHeight: "75%",
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
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  resetLabel: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: "uppercase",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  applyButton: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  applyLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
