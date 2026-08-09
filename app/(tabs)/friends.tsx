import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { CampusEvent, FriendStatus, MockCampusUser, Place } from "@/types";
import { FRIEND_STATUS_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { UserProfileSheet } from "@/features/map/UserProfileSheet";
import { resolveEventPlace } from "@/features/events/eventPlace";
import { campusRepository, eventRepository, placeRepository } from "@/services/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useFriendsStore } from "@/store/useFriendsStore";

const STATUS_OPTIONS = Object.keys(FRIEND_STATUS_META) as FriendStatus[];

export default function FriendsScreen() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const visibleToFriends = useFriendsStore((state) => state.visibleToFriends);
  const setVisibleToFriends = useFriendsStore((state) => state.setVisibleToFriends);
  const myStatus = useFriendsStore((state) => state.myStatus);
  const setMyStatus = useFriendsStore((state) => state.setMyStatus);

  const [friends, setFriends] = useState<MockCampusUser[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<MockCampusUser | null>(null);

  useEffect(() => {
    campusRepository.getMockUsers(selectedCampusId).then(setFriends);
    eventRepository.getEvents(selectedCampusId).then(setEvents);
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
  }, [selectedCampusId]);

  const myStatusMeta = useMemo(() => (myStatus ? FRIEND_STATUS_META[myStatus] : null), [myStatus]);

  function handleSelectEventFromProfile(event: CampusEvent) {
    setSelectedFriend(null);
    // Only curated places have a real detail screen to open — a synthetic
    // place resolved purely from an event's coordinate (see
    // features/events/eventPlace.ts) has nothing further to show there.
    const place = resolveEventPlace(event, places);
    if (place && !place.id.startsWith("event:")) {
      router.push({ pathname: "/place/[id]", params: { id: place.id } });
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <Text style={styles.headerSubtitle}>See who's around and share what you're up to</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.youRow}>
            <View style={styles.youAvatar}>
              <Ionicons name="person" size={18} color={colors.textInverse} />
            </View>
            <View style={styles.youText}>
              <Text style={styles.youName}>You</Text>
              {myStatusMeta ? (
                <View style={styles.statusRow}>
                  <Ionicons name={myStatusMeta.icon} size={12} color={myStatusMeta.color} />
                  <Text style={[styles.statusText, { color: myStatusMeta.color }]}>{myStatusMeta.label}</Text>
                </View>
              ) : (
                <Text style={styles.noStatusText}>No status set</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.visibilityRow}>
            <View style={styles.visibilityText}>
              <Text style={styles.visibilityLabel}>Visible to friends</Text>
              <Text style={styles.visibilityHelper}>
                {visibleToFriends
                  ? "Friends can see your general location on the map."
                  : "You're hidden — friends can't see you on the map right now."}
              </Text>
            </View>
            <Switch
              value={visibleToFriends}
              onValueChange={setVisibleToFriends}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.surface}
              accessibilityLabel="Visible to friends"
              accessibilityRole="switch"
            />
          </View>

          <Text style={styles.sectionLabel}>Set your status</Text>
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map((status) => {
              const meta = FRIEND_STATUS_META[status];
              const active = status === myStatus;
              return (
                <Pressable
                  key={status}
                  onPress={() => setMyStatus(active ? null : status)}
                  accessibilityRole="button"
                  accessibilityLabel={meta.label}
                  accessibilityState={{ selected: active }}
                  style={[styles.statusChip, active && { backgroundColor: meta.color }]}
                >
                  <Ionicons name={meta.icon} size={16} color={active ? colors.textInverse : colors.textPrimary} />
                  <Text style={[styles.statusChipLabel, active && styles.statusChipLabelActive]}>{meta.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Friends nearby</Text>
        {friends.map((friend) => {
          const meta = friend.status ? FRIEND_STATUS_META[friend.status] : null;
          return (
            <Pressable
              key={friend.id}
              onPress={() => setSelectedFriend(friend)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${friend.name}'s profile`}
              style={styles.friendRow}
            >
              <View style={[styles.friendAvatar, { backgroundColor: friend.avatarColor }]}>
                <Text style={styles.friendAvatarInitials}>{friend.avatarInitials}</Text>
              </View>
              <View style={styles.friendText}>
                <Text style={styles.friendName}>{friend.name}</Text>
                {meta ? (
                  <View style={styles.statusRow}>
                    <Ionicons name={meta.icon} size={12} color={meta.color} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                ) : (
                  <Text style={styles.noStatusText}>No status set</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          );
        })}
      </ScrollView>

      <UserProfileSheet
        user={selectedFriend}
        events={events}
        places={places}
        onClose={() => setSelectedFriend(null)}
        onSelectEvent={handleSelectEventFromProfile}
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  youRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  youAvatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  youText: {
    flex: 1,
  },
  youName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "600",
  },
  noStatusText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  visibilityText: {
    flex: 1,
  },
  visibilityLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  visibilityHelper: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    minHeight: touchTarget.minimum,
  },
  statusChipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  statusChipLabelActive: {
    color: colors.textInverse,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  friendAvatarInitials: {
    ...typography.label,
    fontSize: 13,
    color: colors.textInverse,
  },
  friendText: {
    flex: 1,
  },
  friendName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
