import { useEffect, useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { CampusEvent, Place } from "@/types";
import { Badge } from "@/components/Badge";
import { EVENT_CATEGORY_META, PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { EventDetailSheet } from "@/features/events/EventDetailSheet";
import { formatRelativeEventDate, isPastEvent } from "@/features/events/eventDate";
import { resolveEventPlace } from "@/features/events/eventPlace";
import { usePlaceOverrides } from "@/hooks/usePlaceOverrides";
import { eventRepository, placeRepository } from "@/services/repositories";
import { applyPlaceOverride } from "@/services/repositories/firestore/placeOverridesRepository";
import { useAppStore } from "@/store/useAppStore";
import { useDirectionsStore } from "@/store/useDirectionsStore";
import { useSavedEventsStore } from "@/store/useSavedEventsStore";
import { useSavedPlacesStore } from "@/store/useSavedPlacesStore";

interface SavedSection {
  key: "places" | "events";
  title: string;
  data: Array<Place | CampusEvent>;
}

function isPlace(item: Place | CampusEvent): item is Place {
  return "officialName" in item;
}

export default function SavedScreen() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const savedPlaceIds = useSavedPlacesStore((state) => state.savedPlaceIds);
  const togglePlace = useSavedPlacesStore((state) => state.toggleSaved);
  const savedEventIds = useSavedEventsStore((state) => state.savedEventIds);
  const toggleEvent = useSavedEventsStore((state) => state.toggleSaved);
  const requestDirections = useDirectionsStore((state) => state.requestDirections);

  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const placeOverrides = usePlaceOverrides();

  useEffect(() => {
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
    eventRepository.getEvents(selectedCampusId).then(setEvents);
  }, [selectedCampusId]);

  const overriddenPlaces = useMemo(
    () => places.map((place) => applyPlaceOverride(place, placeOverrides.get(place.id))),
    [places, placeOverrides]
  );

  const savedPlaces = overriddenPlaces.filter((place) => savedPlaceIds.includes(place.id));

  // Past events just drop off, same as the map — a saved event doesn't
  // clutter this list forever once it's over.
  const savedEvents = useMemo(
    () =>
      events
        .filter((event) => savedEventIds.includes(event.id) && !isPastEvent(event.date))
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [events, savedEventIds]
  );

  const sections: SavedSection[] = [
    ...(savedPlaces.length > 0 ? [{ key: "places" as const, title: "Places", data: savedPlaces }] : []),
    ...(savedEvents.length > 0 ? [{ key: "events" as const, title: "Events", data: savedEvents }] : []),
  ];

  function handleEventDirections() {
    if (!selectedEvent) return;
    const place = resolveEventPlace(selectedEvent, overriddenPlaces);
    setSelectedEvent(null);
    if (place) {
      requestDirections(place.id);
      router.push("/");
    }
  }

  if (sections.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={40} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>Nothing saved yet</Text>
        <Text style={styles.emptyBody}>
          Tap the bookmark icon on any place or event to save it here for quick access later.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.header}>Saved</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) =>
          isPlace(item) ? (
            <View style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.officialName}</Text>
                {item.localName && <Text style={styles.cardSubtitle}>"{item.localName}"</Text>}
                <View style={styles.badgeRow}>
                  <Badge label={PLACE_CATEGORY_META[item.category].label} icon={PLACE_CATEGORY_META[item.category].icon} tone="accent" />
                </View>
              </View>
              <Pressable
                onPress={() => togglePlace(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.officialName} from saved places`}
                hitSlop={8}
                style={styles.removeButton}
              >
                <Ionicons name="bookmark" size={22} color={colors.accent} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.card} onPress={() => setSelectedEvent(item)} accessibilityRole="button" accessibilityLabel={`Open ${item.title}`}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{formatRelativeEventDate(item.date)}</Text>
                <View style={styles.badgeRow}>
                  <Badge
                    label={EVENT_CATEGORY_META[item.category].label}
                    icon={EVENT_CATEGORY_META[item.category].icon}
                    tone="accent"
                  />
                </View>
              </View>
              <Pressable
                onPress={() => toggleEvent(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.title} from saved events`}
                hitSlop={8}
                style={styles.removeButton}
              >
                <Ionicons name="bookmark" size={22} color={colors.accent} />
              </Pressable>
            </Pressable>
          )
        }
      />

      <EventDetailSheet
        event={selectedEvent}
        placeName={selectedEvent ? resolveEventPlace(selectedEvent, overriddenPlaces)?.officialName ?? null : null}
        onClose={() => setSelectedEvent(null)}
        onGetDirections={handleEventDirections}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    ...typography.h2,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  removeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
