import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type MapView from "react-native-maps";
import { router } from "expo-router";
import type { Campus, ConstructionZone, LatLng, Place, Route } from "@/types";
import { CampusMapView } from "@/features/map/CampusMapView";
import { MapSearchBar } from "@/features/map/MapSearchBar";
import { MapFilterSheet, type MapFilterState } from "@/features/map/MapFilterSheet";
import { PlacePreviewCard } from "@/features/places/PlacePreviewCard";
import { RouteSummaryBar } from "@/features/routing/RouteSummaryBar";
import { haversineDistanceMeters } from "@/features/routing/geo";
import { IconButton } from "@/components/IconButton";
import { MAP_FILTER_CATEGORIES } from "@/constants/categories";
import { colors, spacing } from "@/constants/theme";
import { campusRepository, placeRepository, routeRepository } from "@/services/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useDirectionsStore } from "@/store/useDirectionsStore";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

const DEFAULT_FILTERS: MapFilterState = {
  categories: new Set(MAP_FILTER_CATEGORIES),
  showConstruction: true,
  showAccessibleEntrances: false,
};

export default function MapScreen() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const prefersAccessibleRouting = useAppStore((state) => state.prefersAccessibleRouting);
  const mapRef = useRef<MapView>(null);
  const { requestLocation, isLocating } = useCurrentLocation();

  const pendingDestinationId = useDirectionsStore((state) => state.pendingDestinationId);
  const clearPendingDestination = useDirectionsStore((state) => state.clearPendingDestination);

  const [campus, setCampus] = useState<Campus | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [constructionZones, setConstructionZones] = useState<ConstructionZone[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [routeDestination, setRouteDestination] = useState<Place | null>(null);

  useEffect(() => {
    campusRepository.getCampusById(selectedCampusId).then((result) => setCampus(result ?? null));
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
    campusRepository.getConstructionZones(selectedCampusId).then(setConstructionZones);
  }, [selectedCampusId]);

  useEffect(() => {
    requestLocation({ silent: true }).then(setUserLocation);
  }, [requestLocation]);

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return places.filter((place) => {
      if (!filters.categories.has(place.category)) return false;
      if (!query) return true;
      return (
        place.officialName.toLowerCase().includes(query) ||
        place.localName?.toLowerCase().includes(query) ||
        place.description.toLowerCase().includes(query)
      );
    });
  }, [places, filters.categories, searchQuery]);

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

  // Directions requested from the full place detail screen: it signals the
  // destination here (via the shared store) and hands control back to the
  // map, which is the only place that actually knows how to draw a route.
  useEffect(() => {
    if (!pendingDestinationId) return;
    const place = places.find((candidate) => candidate.id === pendingDestinationId);
    clearPendingDestination();
    if (place) {
      handleDirections(place);
    }
  }, [pendingDestinationId, places, clearPendingDestination, handleDirections]);

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
        showConstruction={filters.showConstruction}
        showAccessibleEntrances={filters.showAccessibleEntrances}
        selectedPlaceId={selectedPlace?.id ?? null}
        activeRoute={activeRoute}
        onSelectPlace={handleSelectPlace}
        onSelectConstructionZone={handleSelectConstructionZone}
        onMapPress={() => setSelectedPlace(null)}
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

      <View style={styles.locateButtonWrapper} pointerEvents="box-none">
        <IconButton
          icon="locate"
          accessibilityLabel="Center map on my current location"
          onPress={handleLocatePress}
          active={isLocating}
        />
      </View>

      {selectedPlace && (
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
});
