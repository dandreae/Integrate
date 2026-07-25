import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CampusReport, ConstructionZone, Place } from "@/types";
import { CONSTRUCTION_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import {
  getPlaceTrustSignals,
  getVerificationStatusBadge,
  hasActiveAccessibilityReport,
  UNVERIFIED_REPORT_BADGE,
} from "@/features/places/dataTrust";
import { REPORT_ISSUE_TYPE_META } from "@/features/reports/reportMeta";
import { isReportActive } from "@/services/reports/reportLifecycle";
import { formatRelativeTime } from "@/services/time/relativeTime";
import { reportRepository } from "@/services/repositories";
import { findAffectedEntrances } from "./affectedEntrances";

const SEVERITY_META: Record<ConstructionZone["severity"], { label: string; color: string }> = {
  low: { label: "Low severity", color: colors.textSecondary },
  medium: { label: "Medium severity", color: colors.warning },
  high: { label: "High severity", color: colors.danger },
};

interface ConstructionDetailSheetProps {
  zone: ConstructionZone | null;
  places: Place[];
  onClose: () => void;
  onReportUpdate: (zone: ConstructionZone) => void;
}

export function ConstructionDetailSheet({ zone, places, onClose, onReportUpdate }: ConstructionDetailSheetProps) {
  const [reports, setReports] = useState<CampusReport[]>([]);

  useEffect(() => {
    if (!zone) {
      setReports([]);
      return;
    }
    reportRepository.getReportsForEntity("constructionZone", zone.id).then(setReports);
  }, [zone]);

  if (!zone) return null;

  const severityMeta = SEVERITY_META[zone.severity];
  const verificationBadge = getVerificationStatusBadge(zone.dataLastVerifiedAt);
  const affectedEntrances = findAffectedEntrances(zone, places);
  const activeReports = reports.filter((report) => isReportActive(report));
  const latestActiveReport = activeReports[0]; // getReportsForEntity/getAllReports both return newest-first
  const trustSignals = getPlaceTrustSignals(
    { dataLastVerifiedAt: zone.dataLastVerifiedAt, verificationSource: zone.verificationSource },
    hasActiveAccessibilityReport(activeReports)
  );

  return (
    <Modal visible={!!zone} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close construction details" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name={CONSTRUCTION_META.icon} size={18} color={colors.textInverse} />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {zone.title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.severityRow}>
          <Ionicons name="alert-circle-outline" size={16} color={severityMeta.color} />
          <Text style={[styles.severityLabel, { color: severityMeta.color }]}>{severityMeta.label}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>{zone.description}</Text>

          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.rowText}>
              {zone.startDate} – {zone.endDate}
            </Text>
          </View>

          <View style={styles.row}>
            <Ionicons
              name={zone.affectedAccessibility ? "accessibility-outline" : "checkmark-circle-outline"}
              size={16}
              color={zone.affectedAccessibility ? colors.warning : colors.accessible}
            />
            <Text style={[styles.rowText, { color: zone.affectedAccessibility ? colors.warning : colors.accessible }]}>
              {zone.affectedAccessibility
                ? "Affects accessible routes"
                : "No accessibility impact reported"}
            </Text>
          </View>

          {affectedEntrances.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entrances possibly affected</Text>
              {affectedEntrances.map(({ entrance, placeName }) => (
                <View key={entrance.id} style={styles.affectedRow}>
                  <Ionicons
                    name={entrance.isAccessible ? "accessibility-outline" : "walk-outline"}
                    size={16}
                    color={colors.textSecondary}
                    style={styles.affectedIcon}
                  />
                  <Text style={styles.affectedText}>
                    {placeName} — {entrance.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data status — official</Text>
            <View style={styles.badgeRow}>
              <Ionicons name={verificationBadge.icon} size={16} color={colors.textSecondary} />
              <Text style={styles.rowText}>{verificationBadge.label}</Text>
            </View>
            <Text style={styles.noteText}>
              Last verified {zone.dataLastVerifiedAt} · {zone.verificationSource}
            </Text>

            {trustSignals.map((signal) => (
              <Pressable
                key={signal.kind}
                onPress={() => Alert.alert(signal.label, signal.explanation)}
                accessibilityRole="button"
                accessibilityLabel={`${signal.label}. Tap for details.`}
                style={styles.trustRow}
              >
                <Ionicons name={signal.icon} size={16} color={colors.warning} />
                <Text style={styles.trustText}>{signal.label}</Text>
              </Pressable>
            ))}
          </View>

          {activeReports.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {activeReports.length} active student {activeReports.length === 1 ? "report" : "reports"}
              </Text>
              {latestActiveReport && (
                <Text style={styles.noteText}>
                  Latest: {formatRelativeTime(latestActiveReport.submittedAt)}
                </Text>
              )}
              {activeReports.map((report) => (
                <View key={report.id} style={styles.reportRow}>
                  <View style={styles.reportHeader}>
                    <Ionicons name={REPORT_ISSUE_TYPE_META[report.issueType].icon} size={16} color={colors.textPrimary} />
                    <Text style={styles.reportType}>{REPORT_ISSUE_TYPE_META[report.issueType].label}</Text>
                  </View>
                  <Text style={styles.noteText}>{report.description}</Text>
                  <Text style={styles.noteText}>{formatRelativeTime(report.submittedAt)}</Text>
                  <View style={styles.unverifiedTag}>
                    <Ionicons name={UNVERIFIED_REPORT_BADGE.icon} size={12} color={colors.textSecondary} />
                    <Text style={styles.unverifiedTagLabel}>{UNVERIFIED_REPORT_BADGE.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <Pressable
          onPress={() => onReportUpdate(zone)}
          accessibilityRole="button"
          accessibilityLabel="Report an update on this construction zone"
          style={styles.reportButton}
        >
          <Ionicons name="flag-outline" size={18} color={colors.textInverse} />
          <Text style={styles.reportButtonLabel}>Report an update</Text>
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
    maxHeight: "85%",
    ...shadow.floating,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CONSTRUCTION_META.color,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  severityLabel: {
    ...typography.bodyStrong,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  rowText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  affectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  affectedIcon: {
    width: 20,
  },
  affectedText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  trustText: {
    ...typography.caption,
    color: colors.warning,
    flexShrink: 1,
  },
  reportRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reportType: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  unverifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  unverifiedTagLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    marginTop: spacing.md,
  },
  reportButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
