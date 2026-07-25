import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CampusReport } from "@/types";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { UNVERIFIED_REPORT_BADGE } from "@/features/places/dataTrust";
import { formatExpiration, getEffectiveLifecycleStatus } from "@/services/reports/reportLifecycle";
import { formatRelativeTime } from "@/services/time/relativeTime";
import { REPORT_ISSUE_TYPE_META, REPORT_SEVERITY_META } from "./reportMeta";

interface ReportDetailSheetProps {
  report: CampusReport | null;
  onClose: () => void;
}

const LIFECYCLE_LABEL: Record<ReturnType<typeof getEffectiveLifecycleStatus>, string> = {
  active: "Active",
  resolved: "Resolved",
  expired: "Expired",
};

export function ReportDetailSheet({ report, onClose }: ReportDetailSheetProps) {
  if (!report) return null;

  const issueMeta = REPORT_ISSUE_TYPE_META[report.issueType];
  const severityMeta = report.severity ? REPORT_SEVERITY_META[report.severity] : null;
  const lifecycleStatus = getEffectiveLifecycleStatus(report);

  return (
    <Modal visible={!!report} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close report details" />
      <View style={styles.cardWrapper} pointerEvents="box-none">
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Ionicons name={issueMeta.icon} size={20} color={colors.textPrimary} />
            <Text style={styles.title} numberOfLines={2}>
              {issueMeta.label}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.unverifiedTag}>
            <Ionicons name={UNVERIFIED_REPORT_BADGE.icon} size={12} color={colors.textSecondary} />
            <Text style={styles.unverifiedTagLabel}>Student reported — unverified</Text>
          </View>

          <Text style={styles.description}>{report.description}</Text>

          {severityMeta && (
            <View style={styles.row}>
              <Ionicons name={severityMeta.icon} size={16} color={colors.textSecondary} />
              <Text style={styles.rowText}>{severityMeta.label} severity</Text>
            </View>
          )}

          <View style={styles.row}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.rowText}>Submitted {formatRelativeTime(report.submittedAt)}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="pulse-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.rowText}>
              {LIFECYCLE_LABEL[lifecycleStatus]} · {formatExpiration(report)}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  cardWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadow.floating,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  unverifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
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
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  rowText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
