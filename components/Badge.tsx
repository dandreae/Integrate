import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { colors, radii, spacing, typography } from "@/constants/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface BadgeProps {
  label: string;
  icon?: IoniconName;
  tone?: "neutral" | "accent" | "accessible" | "warning" | "danger";
}

const TONE_STYLES = {
  neutral: { background: colors.surfaceMuted, text: colors.textPrimary },
  accent: { background: colors.accentMuted, text: colors.accent },
  accessible: { background: colors.accessibleMuted, text: colors.accessible },
  warning: { background: colors.warningMuted, text: colors.warning },
  danger: { background: colors.dangerMuted, text: colors.danger },
};

export function Badge({ label, icon, tone = "neutral" }: BadgeProps) {
  const toneStyle = TONE_STYLES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.background }]}>
      {icon && <Ionicons name={icon} size={14} color={toneStyle.text} style={styles.icon} />}
      <Text style={[styles.label, { color: toneStyle.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
  label: {
    ...typography.label,
  },
});
