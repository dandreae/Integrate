import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DiscoverPost } from "@/types";
import { DISCOVER_POST_TYPE_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { formatRelativePostTime, isExpiredPost } from "./postTime";

interface DiscoverPostCardProps {
  post: DiscoverPost;
  /** Resolved from post.placeId — every post links a real place, so this should always be present. */
  placeName: string;
  hasUpvoted: boolean;
  onUpvote: (post: DiscoverPost) => void;
  onPressPlace: () => void;
}

export function DiscoverPostCard({ post, placeName, hasUpvoted, onUpvote, onPressPlace }: DiscoverPostCardProps) {
  const meta = DISCOVER_POST_TYPE_META[post.type];
  const expired = isExpiredPost(post.expiresAt);
  const locationText = post.locationDetail ? `${placeName} — ${post.locationDetail}` : placeName;

  return (
    <View style={[styles.card, expired && styles.cardExpired]}>
      <View style={styles.headerRow}>
        <View style={[styles.typeBadge, { backgroundColor: meta.color }]}>
          <Ionicons name={meta.icon} size={12} color={colors.textInverse} />
          <Text style={styles.typeBadgeLabel}>{meta.label}</Text>
        </View>
        <Text style={styles.timeText}>{formatRelativePostTime(post.postedAt)}</Text>
      </View>

      {post.title && <Text style={styles.title}>{post.title}</Text>}
      <Text style={[styles.description, !post.title && styles.descriptionNoTitle]}>{post.description}</Text>

      <Pressable
        onPress={onPressPlace}
        accessibilityRole="button"
        accessibilityLabel={`Open ${placeName}`}
        style={styles.locationRow}
      >
        <Ionicons name="location-outline" size={14} color={colors.accent} />
        <Text style={styles.locationText}>{locationText}</Text>
      </Pressable>

      <View style={styles.footerRow}>
        {expired ? (
          <Text style={styles.expiredText}>No longer valid</Text>
        ) : (
          <Pressable
            onPress={() => onUpvote(post)}
            disabled={hasUpvoted}
            accessibilityRole="button"
            accessibilityLabel={hasUpvoted ? "Already upvoted" : "Still going on / I second this"}
            accessibilityState={{ selected: hasUpvoted }}
            style={styles.upvoteButton}
          >
            <Ionicons
              name={hasUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"}
              size={18}
              color={hasUpvoted ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.upvoteText, hasUpvoted && styles.upvoteTextActive]}>{post.upvotes}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    ...shadow.card,
  },
  cardExpired: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  typeBadgeLabel: {
    ...typography.label,
    color: colors.textInverse,
  },
  timeText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  descriptionNoTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  locationText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.accent,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
  upvoteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  upvoteText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  upvoteTextActive: {
    color: colors.accent,
    fontWeight: "600",
  },
  expiredText: {
    ...typography.caption,
    color: colors.danger,
  },
});
