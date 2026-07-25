import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CampusReport } from "@/types";
import { colors, radii, spacing, typography } from "@/constants/theme";
import { UNVERIFIED_REPORT_BADGE } from "@/features/places/dataTrust";
import { ReportDetailSheet } from "@/features/reports/ReportDetailSheet";
import { REPORT_ISSUE_TYPE_META } from "@/features/reports/reportMeta";
import { formatDistanceMeters } from "@/features/routing/geo";
import type { RelevantRouteReport } from "@/services/reports/RouteReportEvaluator";
import { formatRelativeTime } from "@/services/time/relativeTime";

const SEVERITY_COLOR: Record<"low" | "medium" | "high", string> = {
  low: colors.textSecondary,
  medium: colors.warning,
  high: colors.danger,
};

interface RouteReportedConditionsProps {
  relevantReports: RelevantRouteReport[];
}

/**
 * "Reported conditions on this route" — active, relevant student reports,
 * always clearly labeled unverified. Purely informational here; deciding
 * whether to offer an alternative route lives one level up, in
 * RouteOverviewSheet, since that's where the route-preference actions are.
 */
export function RouteReportedConditions({ relevantReports }: RouteReportedConditionsProps) {
  const [selectedReport, setSelectedReport] = useState<CampusReport | null>(null);

  if (relevantReports.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reported conditions on this route</Text>
      {relevantReports.map(({ report, approxDistanceMeters }) => {
        const issueMeta = REPORT_ISSUE_TYPE_META[report.issueType];
        const iconColor = report.severity ? SEVERITY_COLOR[report.severity] : colors.textSecondary;

        return (
          <Pressable
            key={report.id}
            onPress={() => setSelectedReport(report)}
            accessibilityRole="button"
            accessibilityLabel={`${issueMeta.label} report, ${report.severity ?? "unspecified"} severity. Tap for details.`}
            style={styles.row}
          >
            <Ionicons name={issueMeta.icon} size={18} color={iconColor} style={styles.rowIcon} />
            <View style={styles.rowText}>
              <Text style={styles.label}>{issueMeta.label}</Text>
              <Text style={styles.meta}>
                {formatRelativeTime(report.submittedAt)}
                {approxDistanceMeters != null ? ` · ${formatDistanceMeters(approxDistanceMeters)} from route` : ""}
              </Text>
              <View style={styles.unverifiedTag}>
                <Ionicons name={UNVERIFIED_REPORT_BADGE.icon} size={11} color={colors.textSecondary} />
                <Text style={styles.unverifiedTagLabel}>Student reported — unverified</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        );
      })}

      <ReportDetailSheet report={selectedReport} onClose={() => setSelectedReport(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowIcon: {
    marginTop: 2,
  },
  rowText: {
    flex: 1,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
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
});
