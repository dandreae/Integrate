import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import type { ExpectedDurationOption, ReportIssueType, ReportRelatedEntityType, ReportSeverity } from "@/types";
import { colors, radii, spacing, typography } from "@/constants/theme";
import {
  EXPECTED_DURATION_META,
  REPORT_ISSUE_TYPE_META,
  REPORT_ISSUE_TYPES,
  REPORT_RELATED_ENTITY_TYPES,
  REPORT_SEVERITIES,
  REPORT_SEVERITY_META,
} from "@/features/reports/reportMeta";
import { validateReportDraft, type ReportDraft } from "@/features/reports/reportValidation";
import { EXPECTED_DURATION_OPTIONS } from "@/services/reports/reportLifecycle";
import { reportRepository } from "@/services/repositories";

export default function NewReportScreen() {
  const params = useLocalSearchParams<{
    entityType: string;
    entityId: string;
    entityLabel: string;
    latitude?: string;
    longitude?: string;
    affectedRadiusMeters?: string;
  }>();

  const entityType: ReportRelatedEntityType = REPORT_RELATED_ENTITY_TYPES.includes(
    params.entityType as ReportRelatedEntityType
  )
    ? (params.entityType as ReportRelatedEntityType)
    : "general";
  const relatedEntity = {
    type: entityType,
    id: params.entityId ?? "",
    label: params.entityLabel ?? "Unknown",
  };

  const latitude = params.latitude ? Number(params.latitude) : undefined;
  const longitude = params.longitude ? Number(params.longitude) : undefined;
  const coordinates =
    latitude !== undefined && longitude !== undefined && !Number.isNaN(latitude) && !Number.isNaN(longitude)
      ? { latitude, longitude }
      : undefined;
  const affectedRadiusMeters = params.affectedRadiusMeters ? Number(params.affectedRadiusMeters) : undefined;

  const [issueType, setIssueType] = useState<ReportIssueType | null>(null);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<ReportSeverity | undefined>(undefined);
  const [expectedDuration, setExpectedDuration] = useState<ExpectedDurationOption | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof validateReportDraft>["errors"]>({});

  async function handleSubmit() {
    const draft: ReportDraft = {
      issueType,
      relatedEntity,
      description,
      severity,
      expectedDuration,
    };

    const validation = validateReportDraft(draft);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      await reportRepository.createReport({
        issueType: issueType as ReportIssueType,
        relatedEntity,
        description: description.trim(),
        severity,
        expectedDuration,
        coordinates,
        affectedRadiusMeters,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.confirmationContainer}>
          <Ionicons name="checkmark-circle" size={56} color={colors.accessible} />
          <Text style={styles.confirmationTitle}>Report submitted</Text>
          <Text style={styles.confirmationBody}>
            Thanks for the heads-up. This report is stored as unverified, student-reported
            information — the campus team reviews it before anything changes. A single report
            never changes routing on its own.
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Done"
            style={styles.doneButton}
          >
            <Text style={styles.doneButtonLabel}>Done</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Report an issue</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close report form"
          hitSlop={8}
          style={styles.headerCloseButton}
        >
          <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
        </Pressable>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.relatedEntityRow}>
          <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.relatedEntityText} numberOfLines={1}>
            {relatedEntity.label}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Issue type</Text>
        <View style={styles.chipGrid}>
          {REPORT_ISSUE_TYPES.map((type) => {
            const meta = REPORT_ISSUE_TYPE_META[type];
            const active = issueType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setIssueType(type)}
                accessibilityRole="button"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons name={meta.icon} size={16} color={active ? colors.textInverse : colors.textPrimary} />
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.issueType && <Text style={styles.errorText}>{errors.issueType}</Text>}

        <Text style={styles.sectionLabel}>What's going on?</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Short description..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          style={styles.textArea}
          accessibilityLabel="Issue description"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

        <Text style={styles.sectionLabel}>Severity (optional)</Text>
        <View style={styles.chipGrid}>
          {REPORT_SEVERITIES.map((level) => {
            const meta = REPORT_SEVERITY_META[level];
            const active = severity === level;
            return (
              <Pressable
                key={level}
                onPress={() => setSeverity(active ? undefined : level)}
                accessibilityRole="button"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons name={meta.icon} size={16} color={active ? colors.textInverse : colors.textPrimary} />
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Expected duration (optional)</Text>
        <View style={styles.chipGrid}>
          {EXPECTED_DURATION_OPTIONS.map((option) => {
            const meta = EXPECTED_DURATION_META[option];
            const active = expectedDuration === option;
            return (
              <Pressable
                key={option}
                onPress={() => setExpectedDuration(active ? undefined : option)}
                accessibilityRole="button"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons name={meta.icon} size={16} color={active ? colors.textInverse : colors.textPrimary} />
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            Reports are stored as unverified, student-reported information. A single report does
            not change routing.
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit report"
          style={({ pressed }) => [
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
            pressed && styles.submitButtonPressed,
          ]}
        >
          <Text style={styles.submitButtonLabel}>{submitting ? "Submitting..." : "Submit report"}</Text>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  relatedEntityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  relatedEntityText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chipGrid: {
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
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  chipLabelActive: {
    color: colors.textInverse,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  textArea: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: spacing.xl,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  submitButton: {
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  submitButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  confirmationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  confirmationTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  confirmationBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  doneButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
