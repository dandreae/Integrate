import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AccessibilityPreferences } from "@/types";
import { DEFAULT_ACCESSIBILITY_PREFERENCES } from "@/types";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

interface AccessibilityPreferencesSheetProps {
  visible: boolean;
  preferences: AccessibilityPreferences;
  onChange: (preferences: AccessibilityPreferences) => void;
  onClose: () => void;
}

interface ToggleDef {
  key: keyof AccessibilityPreferences;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}

const TOGGLES: ToggleDef[] = [
  {
    key: "avoidStairs",
    label: "Avoid stairs",
    description: "Steer away from routes and entrances with steps, when a reasonable alternative exists.",
    icon: "walk-outline",
  },
  {
    key: "avoidSteepSlopes",
    label: "Avoid steep slopes",
    description: "Steer away from steep ramps or grades, when a reasonable alternative exists.",
    icon: "trending-up-outline",
  },
  {
    key: "requireElevator",
    label: "Require elevator",
    description: "Only suggest destinations with a confirmed working elevator.",
    icon: "arrow-up-outline",
  },
  {
    key: "requireStepFreeEntrance",
    label: "Require step-free entrance",
    description: "Only suggest routes that use a verified, step-free accessible entrance.",
    icon: "shield-checkmark-outline",
  },
];

export function AccessibilityPreferencesSheet({
  visible,
  preferences,
  onChange,
  onClose,
}: AccessibilityPreferencesSheetProps) {
  function toggle(key: keyof AccessibilityPreferences) {
    onChange({ ...preferences, [key]: !preferences[key] });
  }

  function reset() {
    onChange(DEFAULT_ACCESSIBILITY_PREFERENCES);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close accessibility preferences" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Accessibility routing</Text>
          <Pressable onPress={reset} hitSlop={8} accessibilityRole="button">
            <Text style={styles.resetLabel}>Reset</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Applies to every route we suggest. "Require" options only show routes that meet them.
        </Text>

        <View style={styles.toggleList}>
          {TOGGLES.map((toggleDef) => {
            const active = preferences[toggleDef.key];
            return (
              <Pressable
                key={toggleDef.key}
                onPress={() => toggle(toggleDef.key)}
                accessibilityRole="switch"
                accessibilityLabel={toggleDef.label}
                accessibilityState={{ checked: active }}
                style={[styles.toggleRow, active && styles.toggleRowActive]}
              >
                <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                  <Ionicons
                    name={toggleDef.icon}
                    size={18}
                    color={active ? colors.textInverse : colors.textSecondary}
                  />
                </View>
                <View style={styles.toggleTextWrap}>
                  <Text style={styles.toggleLabel}>{toggleDef.label}</Text>
                  <Text style={styles.toggleDescription}>{toggleDef.description}</Text>
                </View>
                <View style={[styles.checkbox, active && styles.checkboxActive]}>
                  {active && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Apply accessibility preferences" style={styles.applyButton}>
          <Text style={styles.applyLabel}>Done</Text>
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
    maxHeight: "80%",
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
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  resetLabel: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  toggleList: {
    gap: spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  toggleRowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  iconWrapActive: {
    backgroundColor: colors.accent,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  toggleDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
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
