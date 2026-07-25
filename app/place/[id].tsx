import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import type { LatLng, Place } from "@/types";
import { Badge } from "@/components/Badge";
import { DisclosureSection } from "@/components/DisclosureSection";
import { ACCESSIBILITY_FEATURE_META, PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { getAccessibilitySummary } from "@/features/places/accessibilitySummary";
import { getConfidenceBadge, getVerificationStatusBadge } from "@/features/places/dataTrust";
import { formatDistanceMeters, haversineDistanceMeters } from "@/features/routing/geo";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { findNearbyPlaces, type NearbyPlaceResult } from "@/services/proximity";
import { placeRepository } from "@/services/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useDirectionsStore } from "@/store/useDirectionsStore";
import { useExploredStore } from "@/store/useExploredStore";
import { useSavedPlacesStore } from "@/store/useSavedPlacesStore";

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campusPlaces, setCampusPlaces] = useState<Place[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const isSaved = useSavedPlacesStore((state) => (place ? state.isSaved(place.id) : false));
  const toggleSaved = useSavedPlacesStore((state) => state.toggleSaved);
  const requestDirections = useDirectionsStore((state) => state.requestDirections);
  const prefersAccessibleRouting = useAppStore((state) => state.prefersAccessibleRouting);
  const markExplored = useExploredStore((state) => state.markExplored);
  const { requestLocation } = useCurrentLocation();

  useEffect(() => {
    if (!id) return;
    placeRepository.getPlaceById(id).then((result) => {
      setPlace(result ?? null);
      setNotFound(!result);
      if (result) markExplored(result.id);
    });
  }, [id, markExplored]);

  useEffect(() => {
    if (!place) return;
    placeRepository.getPlacesByCampus(place.campusId).then(setCampusPlaces);
  }, [place]);

  useEffect(() => {
    requestLocation({ silent: true }).then(setUserLocation);
  }, [requestLocation]);

  const distanceMeters = useMemo(() => {
    if (!place || !userLocation) return null;
    return haversineDistanceMeters(userLocation, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
  }, [place, userLocation]);

  const nearbyPlaces = useMemo<NearbyPlaceResult[]>(() => {
    if (!place || campusPlaces.length === 0) return [];
    return findNearbyPlaces(place, campusPlaces, { limit: 4, curatedIds: place.nearbyPlaceIds });
  }, [place, campusPlaces]);

  function handleDirections() {
    if (!place) return;
    requestDirections(place.id, prefersAccessibleRouting ? "accessible" : "fastest");
    router.back();
  }

  function handleReportIssue() {
    if (!place) return;
    router.push({
      pathname: "/report/new",
      params: {
        entityType: "place",
        entityId: place.id,
        entityLabel: place.officialName,
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        affectedRadiusMeters: "50",
      },
    });
  }

  function handleOpenNearbyPlace(nearbyPlaceId: string) {
    router.push({ pathname: "/place/[id]", params: { id: nearbyPlaceId } });
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
  const hasAccessibleEntrance = place.entrances.some((entrance) => entrance.isAccessible);
  const bestEntrance = place.popularEntrances
    .map((entranceId) => place.entrances.find((entrance) => entrance.id === entranceId))
    .find((entrance): entrance is NonNullable<typeof entrance> => Boolean(entrance));
  const verificationBadge = getVerificationStatusBadge(place.dataLastVerifiedAt);
  const confidenceBadge = getConfidenceBadge(place.confidenceLevel);
  const allTips = [
    ...place.studentTips.map((text) => ({ text, group: undefined })),
    ...place.navigationTips.map((text) => ({ text, group: "Getting around" })),
    ...place.firstYearTips.map((text) => ({ text, group: "For first-years" })),
  ];

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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.officialName}>{place.officialName}</Text>

        {/* What students call it */}
        {(place.localName || place.aliases.length > 0) && (
          <View style={styles.whatStudentsCallIt}>
            {place.localName && (
              <Text style={styles.localName}>Students call it "{place.localName}"</Text>
            )}
            {place.aliases.length > 0 && (
              <View style={styles.aliasRow}>
                {place.aliases.map((alias) => (
                  <Badge key={alias} label={alias} tone="neutral" />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.badgeRow}>
          <Badge label={meta.label} icon={meta.icon} tone="accent" />
          {distanceMeters != null && (
            <Badge label={`${formatDistanceMeters(distanceMeters)} away`} icon="walk-outline" tone="neutral" />
          )}
        </View>

        <Text style={styles.description}>{place.description}</Text>

        <DisclosureSection
          title="Best entrance"
          icon="enter-outline"
          defaultExpanded
          summary={bestEntrance?.label ?? "None on record"}
        >
          {bestEntrance ? (
            <View style={styles.entranceRow}>
              <Ionicons
                name={bestEntrance.isAccessible ? "accessibility-outline" : "walk-outline"}
                size={18}
                color={bestEntrance.isAccessible ? colors.accessible : colors.textSecondary}
                style={styles.entranceIcon}
              />
              <View style={styles.entranceText}>
                <Text style={styles.entranceLabel}>{bestEntrance.label}</Text>
                {bestEntrance.notes && <Text style={styles.noteText}>{bestEntrance.notes}</Text>}
              </View>
            </View>
          ) : (
            <Text style={styles.bodyText}>
              No formal entrance on record — this is an open, walk-up location.
            </Text>
          )}
        </DisclosureSection>

        <DisclosureSection
          title="Accessibility"
          icon="accessibility-outline"
          defaultExpanded
          summary={accessibilitySummary}
        >
          <Text style={[styles.bodyText, hasAccessibleEntrance && { color: colors.accessible }]}>
            {accessibilitySummary}
          </Text>
          {place.accessibilityNotes && (
            <Text style={styles.noteText}>{place.accessibilityNotes}</Text>
          )}
          {place.accessibilityFeatures.length > 0 && (
            <View style={styles.chipRow}>
              {place.accessibilityFeatures.map((feature) => {
                const featureMeta = ACCESSIBILITY_FEATURE_META[feature];
                return (
                  <Badge key={feature} label={featureMeta.label} icon={featureMeta.icon} tone="accessible" />
                );
              })}
            </View>
          )}
          {place.entrances.length > 0 && (
            <View style={styles.entranceList}>
              <Text style={styles.subheading}>All entrances</Text>
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
            </View>
          )}
        </DisclosureSection>

        <DisclosureSection title="Hours" icon="time-outline" defaultExpanded summary={place.openingHours.summary}>
          <Text style={styles.bodyText}>{place.openingHours.summary}</Text>
          {place.openingHours.note && <Text style={styles.noteText}>{place.openingHours.note}</Text>}
          {place.quietHours && (
            <View style={styles.hoursRow}>
              <Ionicons name="volume-mute-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.noteText}>Quietest: {place.quietHours}</Text>
            </View>
          )}
          {place.busyHours && (
            <View style={styles.hoursRow}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.noteText}>Busiest: {place.busyHours}</Text>
            </View>
          )}
        </DisclosureSection>

        {allTips.length > 0 && (
          <DisclosureSection title="Good to know" icon="bulb-outline" summary={`${allTips.length} tips`}>
            {allTips.map((tip, index) => (
              <View key={index}>
                {tip.group && (index === 0 || allTips[index - 1].group !== tip.group) && (
                  <Text style={styles.subheading}>{tip.group}</Text>
                )}
                <View style={styles.tipRow}>
                  <Text style={styles.tipBullet}>{"•"}</Text>
                  <Text style={[styles.bodyText, styles.tipText]}>{tip.text}</Text>
                </View>
              </View>
            ))}
          </DisclosureSection>
        )}

        {nearbyPlaces.length > 0 && (
          <DisclosureSection title="Nearby" icon="map-outline" summary={`${nearbyPlaces.length} places`}>
            {nearbyPlaces.map(({ place: nearbyPlace, distanceMeters: nearbyDistance, reason }) => {
              const nearbyMeta = PLACE_CATEGORY_META[nearbyPlace.category];
              return (
                <Pressable
                  key={nearbyPlace.id}
                  onPress={() => handleOpenNearbyPlace(nearbyPlace.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open details for ${nearbyPlace.officialName}`}
                  style={styles.nearbyRow}
                >
                  <View style={[styles.nearbyIcon, { backgroundColor: nearbyMeta.color }]}>
                    <Ionicons name={nearbyMeta.icon} size={14} color={colors.textInverse} />
                  </View>
                  <View style={styles.nearbyText}>
                    <Text style={styles.entranceLabel} numberOfLines={1}>
                      {nearbyPlace.officialName}
                    </Text>
                    <Text style={styles.noteText}>
                      {reason} · {formatDistanceMeters(nearbyDistance)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>
              );
            })}
          </DisclosureSection>
        )}

        <View style={styles.verificationFooter}>
          <View style={styles.verificationBadgeRow}>
            <Badge label={verificationBadge.label} icon={verificationBadge.icon} tone={verificationBadge.tone} />
            <Badge label={confidenceBadge.label} icon={confidenceBadge.icon} tone={confidenceBadge.tone} />
          </View>
          <Text style={styles.verificationSource}>
            Last verified {place.dataLastVerifiedAt} · {place.verificationSource}
          </Text>
          <Pressable
            onPress={handleReportIssue}
            accessibilityRole="button"
            accessibilityLabel="Report an issue with this place"
            style={styles.reportButton}
          >
            <Ionicons name="flag-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.reportButtonLabel}>Report an issue</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Pressable
          onPress={handleDirections}
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${place.officialName}`}
          style={styles.directionsButton}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.textInverse} />
          <Text style={styles.directionsLabel}>Directions</Text>
        </Pressable>
      </SafeAreaView>
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
  whatStudentsCallIt: {
    marginTop: spacing.xs,
  },
  localName: {
    ...typography.body,
    color: colors.textSecondary,
  },
  aliasRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
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
  bodyText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  subheading: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
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
  entranceList: {
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
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
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
  nearbyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  nearbyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyText: {
    flex: 1,
  },
  verificationFooter: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  verificationBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  verificationSource: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
  },
  reportButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
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
