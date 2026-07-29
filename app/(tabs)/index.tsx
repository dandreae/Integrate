import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type MapView from "react-native-maps";
import { router } from "expo-router";
import type {
  Campus,
  ConstructionSeverity,
  ConstructionZone,
  LatLng,
  Place,
  Proposal,
  Route,
} from "@/types";
import { CampusMapView } from "@/features/map/CampusMapView";
import { MapSearchBar } from "@/features/map/MapSearchBar";
import { MapFilterSheet, type MapFilterState } from "@/features/map/MapFilterSheet";
import { PlacePreviewCard } from "@/features/places/PlacePreviewCard";
import { RouteSummaryBar } from "@/features/routing/RouteSummaryBar";
import { haversineDistanceMeters } from "@/features/routing/geo";
import { ProposeEditSheet } from "@/features/edits/ProposeEditSheet";
import { ConstructionZoneFormSheet } from "@/features/edits/ConstructionZoneFormSheet";
import { IconButton } from "@/components/IconButton";
import { MAP_FILTER_CATEGORIES } from "@/constants/categories";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { campusRepository, placeRepository, routeRepository } from "@/services/repositories";
import {
  submitConstructionZoneProposal,
  submitRenameProposal,
} from "@/services/repositories/firestore/proposalsRepository";
import { applyPlaceOverride } from "@/services/repositories/firestore/placeOverridesRepository";
import { useAppStore } from "@/store/useAppStore";
import { useDirectionsStore } from "@/store/useDirectionsStore";
import { useUserStore } from "@/store/useUserStore";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { usePlaceOverrides } from "@/hooks/usePlaceOverrides";
import { useApprovedConstructionZones } from "@/hooks/useApprovedConstructionZones";
import { usePendingProposals } from "@/hooks/usePendingProposals";

const DEFAULT_FILTERS: MapFilterState = {
  categories: new Set(MAP_FILTER_CATEGORIES),
  showConstruction: true,
  showAccessibleEntrances: false,
};

export default function MapScreen() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const prefersAccessibleRouting = useAppStore((state) => state.prefersAccessibleRouting);
  const uid = useUserStore((state) => state.uid);
  const mapRef = useRef<MapView>(null);
  const { requestLocation, isLocating } = useCurrentLocation();

  const pendingDestinationId = useDirectionsStore((state) => state.pendingDestinationId);
  const clearPendingDestination = useDirectionsStore((state) => state.clearPendingDestination);

  const [campus, setCampus] = useState<Campus | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [seedConstructionZones, setSeedConstructionZones] = useState<ConstructionZone[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [routeDestination, setRouteDestination] = useState<Place | null>(null);

  const [proposeSheetVisible, setProposeSheetVisible] = useState(false);
  const [isDroppingPoints, setIsDroppingPoints] = useState(false);
  const [draftCoordinates, setDraftCoordinates] = useState<LatLng[]>([]);
  const [constructionFormVisible, setConstructionFormVisible] = useState(false);

  const placeOverrides = usePlaceOverrides();
  const pendingProposals = usePendingProposals();
  const constructionZones = useApprovedConstructionZones(selectedCampusId, seedConstructionZones);

  useEffect(() => {
    campusRepository.getCampusById(selectedCampusId).then((result) => setCampus(result ?? null));
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
    campusRepository.getConstructionZones(selectedCampusId).then(setSeedConstructionZones);
  }, [selectedCampusId]);

  useEffect(() => {
    requestLocation({ silent: true }).then(setUserLocation);
  }, [requestLocation]);

  const overriddenPlaces = useMemo(
    () => places.map((place) => applyPlaceOverride(place, placeOverrides.get(place.id))),
    [places, placeOverrides]
  );

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return overriddenPlaces.filter((place) => {
      if (!filters.categories.has(place.category)) return false;
      if (!query) return true;
      return (
        place.officialName.toLowerCase().includes(query) ||
        place.localName?.toLowerCase().includes(query) ||
        place.description.toLowerCase().includes(query)
      );
    });
  }, [overriddenPlaces, filters.categories, searchQuery]);

  const selectedPlaceDistanceMeters = useMemo(() => {
    if (!selectedPlace || !userLocation) return null;
    return haversineDistanceMeters(userLocation, {
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
    });
  }, [selectedPlace, userLocation]);

  const filtersActive =
    filters.categories.size !== MAP_FILTER_CATEGORIES.length ||
    !filters.showConstruction ||
    filters.showAccessibleEntrances;

  function handleSelectPlace(place: Place) {
    setActiveRoute(null);
    setRouteDestination(null);
    setSelectedPlace(place);
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      },
      400
    );
  }

  function handleSelectConstructionZone(zone: ConstructionZone) {
    Alert.alert(zone.title, zone.description);
  }

  function handleSelectProposal(proposal: Proposal) {
    router.push({ pathname: "/proposal/[id]", params: { id: proposal.id } });
  }

  function handleOpenDetail(place: Place) {
    router.push({ pathname: "/place/[id]", params: { id: place.id } });
  }

  const handleDirections = useCallback(
    async (place: Place) => {
      const coords = userLocation ?? (await requestLocation());
      if (!coords) {
        Alert.alert(
          "Location unavailable",
          "Enable location permissions in Settings to get directions from where you are."
        );
        return;
      }
      setUserLocation(coords);

      const route = await routeRepository.getRoute({
        origin: coords,
        destination: { latitude: place.latitude, longitude: place.longitude },
        preference: prefersAccessibleRouting ? "accessible" : "fastest",
      });

      setSelectedPlace(null);
      setActiveRoute(route);
      setRouteDestination(place);
      mapRef.current?.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
        animated: true,
      });
    },
    [userLocation, requestLocation, prefersAccessibleRouting]
  );

  function handleClearRoute() {
    setActiveRoute(null);
    setRouteDestination(null);
  }

  async function handleLocatePress() {
    const coords = await requestLocation();
    if (!coords) {
      Alert.alert(
        "Location unavailable",
        "Enable location permissions in Settings to see where you are on campus."
      );
      return;
    }
    setUserLocation(coords);
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: 0.003, longitudeDelta: 0.003 },
      500
    );
  }

  function handleMapPress(coordinate: LatLng) {
    if (isDroppingPoints) {
      setDraftCoordinates((previous) => [...previous, coordinate]);
      return;
    }
    setSelectedPlace(null);
  }

  function handleStartConstructionReport() {
    setProposeSheetVisible(false);
    setDraftCoordinates([]);
    setIsDroppingPoints(true);
  }

  function handleCancelDroppingPoints() {
    setIsDroppingPoints(false);
    setDraftCoordinates([]);
  }

  function handleFinishDroppingPoints() {
    if (draftCoordinates.length < 2) {
      Alert.alert("Add more points", "Tap at least 2 points on the map to mark the affected area.");
      return;
    }
    setIsDroppingPoints(false);
    setConstructionFormVisible(true);
  }

  async function handleSubmitRename(place: Place, newName: string) {
    if (!uid) {
      Alert.alert("Not ready yet", "Still setting up your account — try again in a moment.");
      return;
    }
    await submitRenameProposal(uid, {
      placeId: place.id,
      currentOfficialName: place.officialName,
      currentLocalName: place.localName,
      proposedOfficialName: newName,
    });
  }

  async function handleSubmitConstructionZone(details: {
    title: string;
    description: string;
    severity: ConstructionSeverity;
  }) {
    if (!uid) {
      Alert.alert("Not ready yet", "Still setting up your account — try again in a moment.");
      return;
    }
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);

    await submitConstructionZoneProposal(uid, {
      campusId: selectedCampusId,
      title: details.title,
      description: details.description,
      coordinates: draftCoordinates,
      severity: details.severity,
      startDate: today.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      affectedAccessibility: false,
    });
    setDraftCoordinates([]);
    setConstructionFormVisible(false);
  }

  // Directions requested from the full place detail screen: it signals the
  // destination here (via the shared store) and hands control back to the
  // map, which is the only place that actually knows how to draw a route.
  useEffect(() => {
    if (!pendingDestinationId) return;
    const place = overriddenPlaces.find((candidate) => candidate.id === pendingDestinationId);
    clearPendingDestination();
    if (place) {
      handleDirections(place);
    }
  }, [pendingDestinationId, overriddenPlaces, clearPendingDestination, handleDirections]);

  if (!campus) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <CampusMapView
        ref={mapRef}
        campus={campus}
        places={filteredPlaces}
        constructionZones={constructionZones}
        pendingProposals={pendingProposals}
        showConstruction={filters.showConstruction}
        showAccessibleEntrances={filters.showAccessibleEntrances}
        selectedPlaceId={selectedPlace?.id ?? null}
        searchActive={searchQuery.trim().length > 0}
        activeRoute={activeRoute}
        draftCoordinates={isDroppingPoints ? draftCoordinates : undefined}
        onSelectPlace={handleSelectPlace}
        onSelectConstructionZone={handleSelectConstructionZone}
        onSelectProposal={handleSelectProposal}
        onMapPress={handleMapPress}
      />

      <SafeAreaView style={styles.topOverlay} edges={["top"]} pointerEvents="box-none">
        <View style={styles.searchWrapper}>
          <MapSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFilterPress={() => setFilterSheetVisible(true)}
            filterActive={filtersActive}
          />
        </View>
      </SafeAreaView>

      {!isDroppingPoints && (
        <>
          <View style={styles.locateButtonWrapper} pointerEvents="box-none">
            <IconButton
              icon="locate"
              accessibilityLabel="Center map on my current location"
              onPress={handleLocatePress}
              active={isLocating}
            />
          </View>
          <View style={styles.proposeButtonWrapper} pointerEvents="box-none">
            <IconButton
              icon="create-outline"
              accessibilityLabel="Suggest an edit to the map"
              onPress={() => setProposeSheetVisible(true)}
            />
          </View>
        </>
      )}

      {isDroppingPoints && (
        <SafeAreaView edges={["bottom"]} style={styles.droppingPointsBar} pointerEvents="box-none">
          <View style={styles.droppingPointsCard}>
            <Text style={styles.droppingPointsText}>
              Tap the map to mark the affected area ({draftCoordinates.length} point
              {draftCoordinates.length === 1 ? "" : "s"})
            </Text>
            <View style={styles.droppingPointsActions}>
              <IconButton
                icon="close"
                accessibilityLabel="Cancel construction report"
                onPress={handleCancelDroppingPoints}
              />
              <IconButton
                icon="checkmark"
                accessibilityLabel="Done marking area"
                onPress={handleFinishDroppingPoints}
                active={draftCoordinates.length >= 2}
              />
            </View>
          </View>
        </SafeAreaView>
      )}

      {selectedPlace && !isDroppingPoints && (
        <PlacePreviewCard
          place={selectedPlace}
          distanceMeters={selectedPlaceDistanceMeters}
          onClose={() => setSelectedPlace(null)}
          onOpenDetail={handleOpenDetail}
          onDirections={handleDirections}
        />
      )}

      {activeRoute && routeDestination && !selectedPlace && (
        <RouteSummaryBar
          destinationName={routeDestination.officialName}
          route={activeRoute}
          onClose={handleClearRoute}
        />
      )}

      <MapFilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterSheetVisible(false)}
      />

      <ProposeEditSheet
        visible={proposeSheetVisible}
        places={overriddenPlaces}
        onClose={() => setProposeSheetVisible(false)}
        onSubmitRename={handleSubmitRename}
        onStartConstructionReport={handleStartConstructionReport}
      />

      <ConstructionZoneFormSheet
        visible={constructionFormVisible}
        pointCount={draftCoordinates.length}
        onCancel={() => {
          setConstructionFormVisible(false);
          setDraftCoordinates([]);
        }}
        onSubmit={handleSubmitConstructionZone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  locateButtonWrapper: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
  },
  proposeButtonWrapper: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl + touchTarget.minimum + spacing.md,
  },
  droppingPointsBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  droppingPointsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    ...shadow.floating,
  },
  droppingPointsText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  droppingPointsActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
