import { useState, type ComponentProps, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/constants/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface DisclosureSectionProps {
  title: string;
  icon: IoniconName;
  children: ReactNode;
  defaultExpanded?: boolean;
  /** Shown next to the title while collapsed, e.g. a one-line preview of what's inside. */
  summary?: string;
}

/**
 * Reusable collapsed-by-default section — the mechanism behind "progressive
 * disclosure" on the place detail screen: a page with many structured
 * knowledge sections stays scannable because most of them start closed.
 */
export function DisclosureSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  summary,
}: DisclosureSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title}, ${expanded ? "expanded" : "collapsed"}`}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Ionicons name={icon} size={18} color={colors.textSecondary} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {!expanded && summary ? (
            <Text style={styles.summary} numberOfLines={1}>
              {summary}
            </Text>
          ) : null}
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  summary: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  content: {
    paddingBottom: spacing.md,
  },
});
