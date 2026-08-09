import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { AccessibilityIssueType, AccessibilityReportSeverity, DiscoverPost, DiscoverPostType, Place } from "@/types";
import { DISCOVER_POST_TYPE_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { DiscoverPostCard } from "@/features/discover/DiscoverPostCard";
import { ShareDiscoverPostSheet } from "@/features/discover/ShareDiscoverPostSheet";
import { ReportAccessibilityIssueSheet } from "@/features/accessibility/ReportAccessibilityIssueSheet";
import { IconButton } from "@/components/IconButton";
import { useDiscoverPosts } from "@/hooks/useDiscoverPosts";
import { accessibilityReportRepository, discoverPostRepository, placeRepository } from "@/services/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useUserStore } from "@/store/useUserStore";

const FILTERS: Array<{ key: DiscoverPostType | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "student-post", label: "Campus chatter" },
  { key: "event", label: "Events" },
  { key: "deal", label: "Deals" },
  { key: "promotion", label: "Promotions" },
];

export default function DiscoverScreen() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const uid = useUserStore((state) => state.uid);
  const posts = useDiscoverPosts();
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeFilter, setActiveFilter] = useState<DiscoverPostType | "all">("all");
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [flaggingPost, setFlaggingPost] = useState<DiscoverPost | null>(null);

  useEffect(() => {
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
  }, [selectedCampusId]);

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);

  const filteredPosts = useMemo(
    () => (activeFilter === "all" ? posts : posts.filter((post) => post.type === activeFilter)),
    [posts, activeFilter]
  );

  async function handleUpvote(postId: string) {
    if (!uid) return;
    setUpvotedIds((previous) => new Set(previous).add(postId));
    await discoverPostRepository.upvote(postId, uid);
  }

  // Escalates a casual Discover post into a real, routing-affecting
  // AccessibilityReport — the manual "flag" version: the student confirms
  // the issue type and description themselves rather than us guessing from
  // the post text, so nothing gets misclassified automatically.
  async function handleSubmitFlaggedReport(details: {
    issueType: AccessibilityIssueType;
    description: string;
    severity: AccessibilityReportSeverity;
  }) {
    if (!uid || !flaggingPost) return;
    await accessibilityReportRepository.submitReport(uid, {
      placeId: flaggingPost.placeId,
      issueType: details.issueType,
      description: details.description,
      severity: details.severity,
    });
    setFlaggedIds((previous) => new Set(previous).add(flaggingPost.id));
    setFlaggingPost(null);
    Alert.alert(
      "Reported",
      "This is now tracked as a real accessibility issue and will affect walking directions to this location."
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Deals, promos, events, and what students are saying around campus</Text>
      </SafeAreaView>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const active = filter.key === activeFilter;
          const color = filter.key === "all" ? colors.accent : DISCOVER_POST_TYPE_META[filter.key].color;
          return (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              accessibilityRole="button"
              accessibilityLabel={filter.label}
              accessibilityState={{ selected: active }}
              style={[styles.filterChip, active && { backgroundColor: color }]}
            >
              <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <DiscoverPostCard
            post={item}
            placeName={placesById.get(item.placeId)?.officialName ?? "Campus"}
            hasUpvoted={upvotedIds.has(item.id)}
            isFlagged={flaggedIds.has(item.id)}
            onUpvote={(post) => handleUpvote(post.id)}
            onFlag={setFlaggingPost}
            onPressPlace={() => router.push({ pathname: "/place/[id]", params: { id: item.placeId } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="compass-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>Be the first to share what's going on somewhere on campus.</Text>
          </View>
        }
      />

      <View style={styles.fabWrapper} pointerEvents="box-none">
        <IconButton icon="add" accessibilityLabel="Share something with Discover" onPress={() => setShareSheetVisible(true)} />
      </View>

      <ShareDiscoverPostSheet
        visible={shareSheetVisible}
        places={places}
        onCancel={() => setShareSheetVisible(false)}
        onSubmit={async (details) => {
          if (!uid) return;
          await discoverPostRepository.submitPost(uid, details);
          setShareSheetVisible(false);
        }}
      />

      <ReportAccessibilityIssueSheet
        visible={flaggingPost !== null}
        placeName={flaggingPost ? placesById.get(flaggingPost.placeId)?.officialName ?? "Campus" : ""}
        initialDescription={
          flaggingPost ? (flaggingPost.title ? `${flaggingPost.title}: ${flaggingPost.description}` : flaggingPost.description) : ""
        }
        onCancel={() => setFlaggingPost(null)}
        onSubmit={handleSubmitFlaggedReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    minHeight: touchTarget.minimum,
  },
  filterChipLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filterChipLabelActive: {
    color: colors.textInverse,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  separator: {
    height: spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  fabWrapper: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    ...shadow.floating,
  },
});
