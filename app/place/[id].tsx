import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import type { LatLng, Place } from "@/types";
import { Badge } from "@/components/Badge";
import { ACCESSIBILITY_FEATURE_META, PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { getAccessibilitySummary } from "@/features/places/accessibilitySummary";
import { PlacePickerSheet } from "@/features/places/PlacePickerSheet";
import { formatDistanceMeters, haversineDistanceMeters } from "@/features/routing/geo";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { usePlaceOverrides } from "@/hooks/usePlaceOverrides";
import { placeRepository } from "@/services/repositories";
import { applyPlaceOverride } from "@/services/repositories/firestore/placeOverridesRepository";
import { useDirectionsStore } from "@/store/useDirectionsStore";
import { useSavedPlacesStore } from "@/store/useSavedPlacesStore";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rawPlace, setRawPlace] = useState<Place | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [campusPlaces, setCampusPlaces] = useState<Place[]>([]);
  const [originPickerVisible, setOriginPickerVisible] = useState(false);
  const placeOverrides = usePlaceOverrides();

  const place = useMemo(
    () => (rawPlace ? applyPlaceOverride(rawPlace, placeOverrides.get(rawPlace.id)) : null),
    [rawPlace, placeOverrides]
  );

  const isSaved = useSavedPlacesStore((state) => (place ? state.isSaved(place.id) : false));
  const toggleSaved = useSavedPlacesStore((state) => state.toggleSaved);
  const requestDirections = useDirectionsStore((state) => state.requestDirections);
  const { requestLocation } = useCurrentLocation();

  useEffect(() => {
    if (!id) return;
    placeRepository.getPlaceById(id).then((result) => {
      setRawPlace(result ?? null);
      setNotFound(!result);
    });
  }, [id]);

  useEffect(() => {
    requestLocation({ silent: true }).then(setUserLocation);
  }, [requestLocation]);

  useEffect(() => {
    if (!place) return;
    placeRepository.getPlacesByCampus(place.campusId).then(setCampusPlaces);
  }, [place?.campusId]);

  const distanceMeters = useMemo(() => {
    if (!place || !userLocation) return null;
    return haversineDistanceMeters(userLocation, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
  }, [place, userLocation]);

  function handleDirections() {
    if (!place) return;
    requestDirections(place.id);
    router.back();
  }

  function handleDirectionsPress() {
    if (!place) return;
    Alert.alert(`Directions to ${place.officialName}`, "Start from where?", [
      { text: "My Location", onPress: handleDirections },
      { text: "Choose starting point...", onPress: () => setOriginPickerVisible(true) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function handleDirectionsFrom(origin: Place) {
    if (!place) return;
    setOriginPickerVisible(false);
    requestDirections(place.id, origin.id);
    router.back();
  }

  if (notFound) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.notFoundTitle}>Place not found</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.notFoundButton}
          >
            <Text style={styles.notFoundButtonLabel}>Go back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (!place) {
    return <View style={styles.container} />;
  }

  const meta = PLACE_CATEGORY_META[place.category];
  const accessibilitySummary = getAccessibilitySummary(place);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close place details"
          hitSlop={8}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={() => toggleSaved(place.id)}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? "Remove from saved places" : "Save this place"}
          accessibilityState={{ selected: isSaved }}
          hitSlop={8}
          style={styles.headerButton}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isSaved ? colors.accent : colors.textPrimary}
          />
        </Pressable>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.officialName}>{place.officialName}</Text>
        {place.localName && (
          <Text style={styles.localName}>Students call it "{place.localName}"</Text>
        )}

        <View style={styles.badgeRow}>
          <Badge label={meta.label} icon={meta.icon} tone="accent" />
          {distanceMeters != null && (
            <Badge
              label={`${formatDistanceMeters(distanceMeters)} away`}
              icon="walk-outline"
              tone="neutral"
            />
          )}
        </View>

        <Text style={styles.description}>{place.description}</Text>

        <Section title="Hours" icon="time-outline">
          <Text style={styles.bodyText}>{place.openingHours.summary}</Text>
          {place.openingHours.note && (
            <Text style={styles.noteText}>{place.openingHours.note}</Text>
          )}
        </Section>

        <Section title="Accessibility" icon="accessibility-outline">
          <Text
            style={[
              styles.bodyText,
              place.entrances.some((entrance) => entrance.isAccessible) && {
                color: colors.accessible,
              },
            ]}
          >
            {accessibilitySummary}
          </Text>
          {place.accessibilityFeatures.length > 0 && (
            <View style={styles.chipRow}>
              {place.accessibilityFeatures.map((feature) => {
                const featureMeta = ACCESSIBILITY_FEATURE_META[feature];
                return (
                  <Badge
                    key={feature}
                    label={featureMeta.label}
                    icon={featureMeta.icon}
                    tone="accessible"
                  />
                );
              })}
            </View>
          )}
        </Section>

        {place.entrances.length > 0 && (
          <Section title="Entrances" icon="enter-outline">
            {place.entrances.map((entrance) => (
              <View key={entrance.id} style={styles.entranceRow}>
                <Ionicons
                  name={entrance.isAccessible ? "accessibility-outline" : "walk-outline"}
                  size={18}
                  color={entrance.isAccessible ? colors.accessible : colors.textSecondary}
                  style={styles.entranceIcon}
                />
                <View style={styles.entranceText}>
                  <Text style={styles.entranceLabel}>{entrance.label}</Text>
                  {entrance.notes && <Text style={styles.noteText}>{entrance.notes}</Text>}
                </View>
              </View>
            ))}
          </Section>
        )}

        {place.studentTips.length > 0 && (
          <Section title="Student tips" icon="bulb-outline">
            {place.studentTips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={styles.tipBullet}>{"•"}</Text>
                <Text style={[styles.bodyText, styles.tipText]}>{tip}</Text>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Pressable
          onPress={handleDirectionsPress}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${place.officialName}`}
          style={styles.directionsButton}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.textInverse} />
          <Text style={styles.directionsLabel}>Directions</Text>
        </Pressable>
      </SafeAreaView>

      <PlacePickerSheet
        visible={originPickerVisible}
        title={`Directions to ${place.officialName} from...`}
        places={campusPlaces}
        excludePlaceId={place.id}
        onClose={() => setOriginPickerVisible(false)}
        onSelect={handleDirectionsFrom}
      />
    </View>
  );
}

interface SectionProps {
  title: string;
  icon: IoniconName;
  children: ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  officialName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  localName: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  noteText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  entranceRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  entranceIcon: {
    marginTop: 2,
  },
  entranceText: {
    flex: 1,
  },
  entranceLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  tipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tipBullet: {
    ...typography.body,
    color: colors.accent,
  },
  tipText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  directionsButton: {
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.accent,
    ...shadow.card,
  },
  directionsLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  notFoundTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  notFoundButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
