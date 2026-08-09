import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CampusEvent, MockCampusUser, Place } from "@/types";
import { EVENT_CATEGORY_META, FRIEND_STATUS_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { formatRelativeEventDate } from "@/features/events/eventDate";
import { resolveEventPlace } from "@/features/events/eventPlace";

interface UserProfileSheetProps {
  user: MockCampusUser | null;
  events: CampusEvent[];
  places: Place[];
  onClose: () => void;
  onSelectEvent: (event: CampusEvent) => void;
}

export function UserProfileSheet({ user, events, places, onClose, onSelectEvent }: UserProfileSheetProps) {
  const visible = user !== null;
  if (!user) return null;

  const savedEvents = user.savedEventIds
    .map((eventId) => events.find((event) => event.id === eventId))
    .filter((event): event is CampusEvent => event !== undefined);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <View style={styles.identity}>
            <View style={[styles.avatar, { backgroundColor: user.avatarColor }]}>
              <Text style={styles.avatarInitials}>{user.avatarInitials}</Text>
            </View>
            <View>
              <Text style={styles.name}>{user.name}</Text>
              {user.status && (
                <View style={styles.statusRow}>
                  <Ionicons
                    name={FRIEND_STATUS_META[user.status].icon}
                    size={12}
                    color={FRIEND_STATUS_META[user.status].color}
                  />
                  <Text style={[styles.statusText, { color: FRIEND_STATUS_META[user.status].color }]}>
                    {FRIEND_STATUS_META[user.status].label}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>
          {savedEvents.length > 0 ? "Saved / planning to attend" : "No saved events yet"}
        </Text>

        {savedEvents.map((event) => {
          const place = resolveEventPlace(event, places);
          const meta = EVENT_CATEGORY_META[event.category];
          return (
            <Pressable
              key={event.id}
              onPress={() => onSelectEvent(event)}
              accessibilityRole="button"
              accessibilityLabel={`Open event ${event.title}`}
              style={styles.eventRow}
            >
              <View style={[styles.eventIcon, { backgroundColor: meta.color }]}>
                <Ionicons name={meta.icon} size={14} color={colors.textInverse} />
              </View>
              <View style={styles.eventText}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventMeta}>
                  {formatRelativeEventDate(event.date)}
                  {place ? ` · ${place.officialName}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          );
        })}
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
    ...shadow.floating,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    ...typography.label,
    fontSize: 13,
    color: colors.textInverse,
  },
  name: {
    ...typography.h3,
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
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.minimum,
  },
  eventIcon: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  eventText: {
    flex: 1,
  },
  eventTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  eventMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
