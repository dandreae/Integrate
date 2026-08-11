import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";

interface ChooseOriginSheetProps {
  visible: boolean;
  placeName: string;
  onMyLocation: () => void;
  onChooseStartingPoint: () => void;
  onCancel: () => void;
}

export function ChooseOriginSheet({
  visible,
  placeName,
  onMyLocation,
  onChooseStartingPoint,
  onCancel,
}: ChooseOriginSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Cancel" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Directions to {placeName}</Text>
        <Text style={styles.subtitle}>Start from where?</Text>

        <Pressable
          onPress={onMyLocation}
          accessibilityRole="button"
          accessibilityLabel="Start from my location"
          style={styles.option}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="locate" size={18} color={colors.textInverse} />
          </View>
          <Text style={styles.optionLabel}>My Location</Text>
        </Pressable>

        <Pressable
          onPress={onChooseStartingPoint}
          accessibilityRole="button"
          accessibilityLabel="Search for a starting point"
          style={styles.option}
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="search" size={18} color={colors.textPrimary} />
          </View>
          <Text style={styles.optionLabel}>Search for a place...</Text>
        </Pressable>

        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={styles.cancelButton}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
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
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.minimum,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  cancelButton: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.sm,
  },
  cancelLabel: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
});
