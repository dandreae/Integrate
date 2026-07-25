import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { CampusReport } from "@/types";
import { colors, spacing, typography } from "@/constants/theme";
import { getEffectiveLifecycleStatus } from "@/services/reports/reportLifecycle";
import { reportRepository } from "@/services/repositories";
import { REPORT_ISSUE_TYPE_META } from "./reportMeta";

/**
 * Deliberately unpolished — this is a developer/testing affordance, not a
 * designed product feature. Only ever rendered behind `__DEV__` by the
 * caller, per the phase's "development-only, not production-polished"
 * requirement for lifecycle controls (mark resolved / clear all reports).
 */
export function ReportDevTools() {
  const [reports, setReports] = useState<CampusReport[]>([]);

  const refresh = useCallback(() => {
    reportRepository.getAllReports().then(setReports);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleMarkResolved(reportId: string) {
    await reportRepository.markResolved(reportId);
    refresh();
  }

  function handleClearAll() {
    Alert.alert("Clear all reports?", "This deletes every stored report. Dev/testing only.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await reportRepository.clearAll();
          refresh();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>DEV TOOLS — Reports ({reports.length})</Text>

      <Pressable onPress={refresh} style={styles.devButton}>
        <Text style={styles.devButtonLabel}>Refresh</Text>
      </Pressable>

      {reports.map((report) => {
        const status = getEffectiveLifecycleStatus(report);
        return (
          <View key={report.id} style={styles.row}>
            <Text style={styles.rowText}>
              [{status}] {REPORT_ISSUE_TYPE_META[report.issueType].label} — {report.relatedEntity.label}
            </Text>
            <Pressable
              onPress={() => handleMarkResolved(report.id)}
              disabled={status === "resolved"}
              style={[styles.devButton, status === "resolved" && styles.devButtonDisabled]}
            >
              <Text style={styles.devButtonLabel}>Mark resolved</Text>
            </Pressable>
          </View>
        );
      })}

      <Pressable onPress={handleClearAll} style={[styles.devButton, styles.clearButton]}>
        <Text style={styles.devButtonLabel}>Clear all reports</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: "dashed",
    width: "100%",
    paddingHorizontal: spacing.lg,
  },
  heading: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    marginBottom: spacing.sm,
  },
  rowText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  devButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  devButtonDisabled: {
    opacity: 0.4,
  },
  devButtonLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  clearButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.dangerMuted,
  },
});
