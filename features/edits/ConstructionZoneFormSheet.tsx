import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ConstructionSeverity } from "@/types";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

const SEVERITIES: ConstructionSeverity[] = ["low", "medium", "high"];

interface ConstructionZoneFormSheetProps {
  visible: boolean;
  pointCount: number;
  onCancel: () => void;
  onSubmit: (details: {
    title: string;
    description: string;
    severity: ConstructionSeverity;
  }) => Promise<void>;
}

export function ConstructionZoneFormSheet({
  visible,
  pointCount,
  onCancel,
  onSubmit,
}: ConstructionZoneFormSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<ConstructionSeverity>("medium");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setSeverity("medium");
    setSubmitting(false);
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), severity });
      reset();
    } catch {
      Alert.alert("Couldn't submit", "Something went wrong — try again.");
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel} accessibilityLabel="Cancel" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Report construction</Text>
          <Pressable onPress={handleCancel} accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={styles.helperText}>
          {pointCount} point{pointCount === 1 ? "" : "s"} marked on the map
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (e.g. Sidewalk closed)"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          accessibilityLabel="Construction title"
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What's affected, and any detour"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.multilineInput]}
          multiline
          accessibilityLabel="Construction description"
        />

        <Text style={styles.smallLabel}>Severity</Text>
        <View style={styles.severityRow}>
          {SEVERITIES.map((option) => {
            const active = option === severity;
            return (
              <Pressable
                key={option}
                onPress={() => setSeverity(option)}
                accessibilityRole="button"
                accessibilityLabel={`Severity: ${option}`}
                accessibilityState={{ selected: active }}
                style={[styles.severityChip, active && styles.severityChipActive]}
              >
                <Text style={[styles.severityLabel, active && styles.severityLabelActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !title.trim() || !description.trim()}
          accessibilityRole="button"
          accessibilityLabel="Submit construction report"
          style={[
            styles.submitButton,
            (submitting || !title.trim() || !description.trim()) && styles.submitButtonDisabled,
          ]}
        >
          <Text style={styles.submitLabel}>{submitting ? "Submitting…" : "Submit for confirmation"}</Text>
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
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  multilineInput: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: "top",
  },
  smallLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  severityRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  severityChip: {
    flex: 1,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  severityChipActive: {
    backgroundColor: colors.accent,
  },
  severityLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  severityLabelActive: {
    color: colors.textInverse,
  },
  submitButton: {
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
