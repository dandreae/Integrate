import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AccessibilityReport } from "@/types";
import { ACCESSIBILITY_ISSUE_META } from "@/types";
import { ACCESSIBILITY_CONFIDENCE_META } from "@/constants/categories";
import { colors, radii, spacing, touchTarget, typography } from "@/constants/theme";
import { getReportConfidence, isEffectivelyActive } from "@/services/accessibility/reportConfidence";

interface AccessibilityReportBannerProps {
  report: AccessibilityReport;
  onConfirmStillActive: () => void;
  onConfirmFixed: () => void;
}

/**
 * One accessibility report, with a confidence badge (🟢/🟡/🔴 — see
 * services/accessibility/reportConfidence.ts) and, for still-active reports,
 * "Still an issue" / "Fixed" buttons so other students can keep the status
 * current. Renders nothing for a report with no confidence signal to show
 * (expired and never reconfirmed, or resolved too long ago) — callers should
 * generally filter with `shouldDisplayReport` first, but this is a safe
 * no-op either way.
 */
export function AccessibilityReportBanner({
  report,
  onConfirmStillActive,
  onConfirmFixed,
}: AccessibilityReportBannerProps) {
  const confidence = getReportConfidence(report);
  if (!confidence) return null;

  const confidenceMeta = ACCESSIBILITY_CONFIDENCE_META[confidence];
  const issueMeta = ACCESSIBILITY_ISSUE_META[report.issueType];
  const active = isEffectivelyActive(report);

  return (
    <View style={[styles.banner, { borderColor: confidenceMeta.color }]}>
      <View style={styles.headerRow}>
        <Ionicons name={issueMeta.icon} size={16} color={confidenceMeta.color} />
        <Text style={[styles.confidenceLabel, { color: confidenceMeta.color }]} numberOfLines={1}>
          {confidenceMeta.emoji} {confidenceMeta.label}
        </Text>
      </View>
      <Text style={styles.bannerText}>
        {issueMeta.label}: {report.description}
      </Text>

      {active && (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={onConfirmStillActive}
            accessibilityRole="button"
            accessibilityLabel={`Confirm ${issueMeta.label} is still an issue`}
            style={styles.actionButton}
          >
            <Ionicons name="alert-circle-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.actionLabel}>Still an issue</Text>
          </Pressable>
          <Pressable
            onPress={onConfirmFixed}
            accessibilityRole="button"
            accessibilityLabel={`Confirm ${issueMeta.label} has been fixed`}
            style={styles.actionButton}
          >
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.accessible} />
            <Text style={[styles.actionLabel, { color: colors.accessible }]}>Fixed</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    backgroundColor: colors.surfaceMuted,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confidenceLabel: {
    ...typography.label,
    flexShrink: 1,
  },
  bannerText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: touchTarget.minimum - 12,
  },
  actionLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
