import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ACCESSIBILITY_ISSUE_META, type AccessibilityIssueType } from "@/types";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

const ISSUE_TYPES = Object.keys(ACCESSIBILITY_ISSUE_META) as AccessibilityIssueType[];

interface ReportAccessibilityIssueSheetProps {
  visible: boolean;
  placeName: string;
  onCancel: () => void;
  onSubmit: (details: { issueType: AccessibilityIssueType; description: string }) => Promise<void>;
}

export function ReportAccessibilityIssueSheet({
  visible,
  placeName,
  onCancel,
  onSubmit,
}: ReportAccessibilityIssueSheetProps) {
  const [issueType, setIssueType] = useState<AccessibilityIssueType>("elevator-out");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setIssueType("elevator-out");
    setDescription("");
    setSubmitting(false);
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  async function handleSubmit() {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ issueType, description: description.trim() });
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
          <Text style={styles.title}>Report an accessibility issue</Text>
          <Pressable onPress={handleCancel} accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={styles.helperText}>at {placeName}</Text>

        <Text style={styles.smallLabel}>What's the issue?</Text>
        <View style={styles.issueGrid}>
          {ISSUE_TYPES.map((type) => {
            const meta = ACCESSIBILITY_ISSUE_META[type];
            const active = type === issueType;
            return (
              <Pressable
                key={type}
                onPress={() => setIssueType(type)}
                accessibilityRole="button"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: active }}
                style={[styles.issueChip, active && styles.issueChipActive]}
              >
                <Ionicons name={meta.icon} size={16} color={active ? colors.textInverse : colors.textPrimary} />
                <Text style={[styles.issueLabel, active && styles.issueLabelActive]}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Details — where exactly, and any workaround you used"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.multilineInput]}
          multiline
          accessibilityLabel="Issue description"
        />

        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !description.trim()}
          accessibilityRole="button"
          accessibilityLabel="Submit accessibility report"
          style={[styles.submitButton, (submitting || !description.trim()) && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitLabel}>{submitting ? "Submitting…" : "Submit report"}</Text>
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
  smallLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  issueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  issueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    minHeight: 40,
  },
  issueChipActive: {
    backgroundColor: colors.accent,
  },
  issueLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  issueLabelActive: {
    color: colors.textInverse,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  multilineInput: {
    height: 90,
    paddingTop: spacing.sm,
    textAlignVertical: "top",
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
