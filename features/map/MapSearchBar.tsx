import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

interface MapSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  filterActive: boolean;
}

export function MapSearchBar({ value, onChangeText, onFilterPress, filterActive }: MapSearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchField}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search buildings, food, spots..."
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          accessibilityLabel="Search campus places"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <Pressable
        onPress={onFilterPress}
        accessibilityRole="button"
        accessibilityLabel="Filter map markers"
        accessibilityState={{ selected: filterActive }}
        style={({ pressed }) => [
          styles.filterButton,
          filterActive && styles.filterButtonActive,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={filterActive ? colors.textInverse : colors.textPrimary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
    ...shadow.floating,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: "100%",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.floating,
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
});
