import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type MapView from "react-native-maps";
import { router } from "expo-router";
import type { Campus, ConstructionZone, LatLng, Place, Route, RoutePreference } from "@/types";
import { CampusMapView } from "@/features/map/CampusMapView";
import { MapSearchBar } from "@/features/map/MapSearchBar";
import { MapFilterSheet, type MapFilterState } from "@/features/map/MapFilterSheet";
import { ConstructionDetailSheet } from "@/features/conditions/ConstructionDetailSheet";
import { MapLegend } from "@/features/conditions/MapLegend";
import { DemoBanner } from "@/features/demo/DemoBanner";
import { PlacePreviewCard } from "@/features/places/PlacePreviewCard";
import { RouteOverviewSheet } from "@/features/routing/RouteOverviewSheet";
import { RouteSummaryBar } from "@/features/routing/RouteSummaryBar";
import { haversineDistanceMeters } from "@/features/routing/geo";
import { placeToDestinationEndpoint, resolveRouteOrigin } from "@/features/routing/resolveEndpoint";
import { findPlacesAlongRoute, type PassedPlace } from "@/features/routing/routePassesBy";
import { SearchResultsList } from "@/features/search/SearchResultsList";
import { IconButton } from "@/components/IconButton";
import { MAP_FILTER_CATEGORIES } from "@/constants/categories";
import { colors, spacing } from "@/constants/theme";
import { campusRepository, placeRepository, reportRepository, routeRepository } from "@/services/repositories";
import {
  evaluateReportsForRoute,
  suggestAlternativePreference,
  type RelevantRouteReport,
} from "@/services/reports/RouteReportEvaluator";
import { searchPlaces, type PlaceSearchResult } from "@/services/search";
import { useAppStore } from "@/store/useAppStore";
import { useDirectionsStore, type PendingRouteRequest } from "@/store/useDirectionsStore";
import { useExploredStore } from "@/store/useExploredStore";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

const DEFAULT_FILTERS: MapFilterState = {
  categories: new Set(MAP_FILTER_CATEGORIES),
  showConstruction: true,
  showAccessibleEntrances: false,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fixed, GPS-independent stops for Demo Mode — chosen because the straight
// line between them reliably passes within the mock routing engine's
// construction-detection buffer, so the "we found construction ahead" beat
// reproduces the same way on every run, regardless of where the demo
// device physically is.
const DEMO_ORIGIN_PLACE_ID = "healy-hall";
const DEMO_DESTINATION_PLACE_ID = "saxbys-georgetown";

export default function MapScreen() {
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const prefersAccessibleRouting = useAppStore((state) => state.prefersAccessibleRouting);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const mapRef = useRef<MapView>(null);
  const { requestLocation, isLocating } = useCurrentLocation();

  const pendingRequest = useDirectionsStore((state) => state.pendingRequest);
  const clearPendingRequest = useDirectionsStore((state) => state.clearPendingRequest);
  const markExplored = useExploredStore((state) => state.markExplored);

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
  const [routeOverviewVisible, setRouteOverviewVisible] = useState(false);
  const [lastRouteRequest, setLastRouteRequest] = useState<PendingRouteRequest | null>(null);
  const [relevantReports, setRelevantReports] = useState<RelevantRouteReport[]>([]);
  const [passedPlaces, setPassedPlaces] = useState<PassedPlace[]>([]);

  const [selectedConstructionZone, setSelectedConstructionZone] = useState<ConstructionZone | null>(null);
  const [legendVisible, setLegendVisible] = useState(false);

  const [demoActive, setDemoActive] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const demoCancelledRef = useRef(false);

  useEffect(() => {
    campusRepository.getCampusById(selectedCampusId).then((result) => setCampus(result ?? null));
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
    campusRepository.getConstructionZones(selectedCampusId).then(setConstructionZones);
  }, [selectedCampusId]);

  useEffect(() => {
    requestLocation({ silent: true }).then(setUserLocation);
  }, [requestLocation]);

  // First-ever launch: guide new students through campus instead of
  // dropping them on a blank map. Fires once per app session — the map tab
  // stays mounted after that, so this effect doesn't re-fire on tab switches.
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      // Defer past this mount cycle — navigating synchronously here can race
      // with the root Stack/Tabs navigator still finishing its own mount.
      const timeout = setTimeout(() => router.push("/first-day"), 0);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryFilteredPlaces = useMemo(
    () => places.filter((place) => filters.categories.has(place.category)),
    [places, filters.categories]
  );

  const searchResults = useMemo<PlaceSearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    return searchPlaces(searchQuery, categoryFilteredPlaces, { userLocation });
  }, [categoryFilteredPlaces, searchQuery, userLocation]);

  const isSearching = searchQuery.trim().length > 0;

  const filteredPlaces = useMemo(
    () => (isSearching ? searchResults.map((result) => result.place) : categoryFilteredPlaces),
    [isSearching, searchResults, categoryFilteredPlaces]
  );

  const selectedPlaceDistanceMeters = useMemo(() => {
    if (!selectedPlace || !userLocation) return null;
    return haversineDistanceMeters(userLocation, {
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
    });
  }, [selectedPlace, userLocation]);

  const alternativeSuggestion = useMemo(() => {
    if (!activeRoute) return null;
    return suggestAlternativePreference(relevantReports, activeRoute.preference);
  }, [relevantReports, activeRoute]);

  const filtersActive =
    filters.categories.size !== MAP_FILTER_CATEGORIES.length ||
    !filters.showConstruction ||
    filters.showAccessibleEntrances;

  function handleSelectPlace(place: Place) {
    setActiveRoute(null);
    setRouteDestination(null);
    setRouteOverviewVisible(false);
    setSelectedPlace(place);
    markExplored(place.id);
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
    setSelectedConstructionZone(zone);
  }

  function handleReportConstructionUpdate(zone: ConstructionZone) {
    setSelectedConstructionZone(null);
    const centroidLatitude =
      zone.coordinates.reduce((sum, point) => sum + point.latitude, 0) / zone.coordinates.length;
    const centroidLongitude =
      zone.coordinates.reduce((sum, point) => sum + point.longitude, 0) / zone.coordinates.length;
    router.push({
      pathname: "/report/new",
      params: {
        entityType: "constructionZone",
        entityId: zone.id,
        entityLabel: zone.title,
        latitude: String(centroidLatitude),
        longitude: String(centroidLongitude),
        affectedRadiusMeters: "60",
      },
    });
  }

  function handleReportRouteIssue() {
    if (!activeRoute || !routeDestination) return;
    setRouteOverviewVisible(false);
    const midpointIndex = Math.floor(activeRoute.coordinates.length / 2);
    const midpoint = activeRoute.coordinates[midpointIndex];
    router.push({
      pathname: "/report/new",
      params: {
        entityType: "routeSegment",
        entityId: activeRoute.id,
        entityLabel: `Route to ${routeDestination.officialName}`,
        ...(midpoint
          ? { latitude: String(midpoint.latitude), longitude: String(midpoint.longitude) }
          : {}),
        affectedRadiusMeters: "100",
      },
    });
  }

  function handleSelectSearchResult(place: Place) {
    setSearchQuery("");
    handleSelectPlace(place);
  }

  function handleOpenDetail(place: Place) {
    router.push({ pathname: "/place/[id]", params: { id: place.id } });
  }

  function handlePlanRoute() {
    router.push("/route-planner");
  }

  // Single source of truth for turning a route request (from the quick
  // "Directions" tap, the place detail screen, or the route planner) into a
  // drawn route. `keepOverviewOpen` is used when only the preference chip in
  // the overview sheet changed, so recomputing doesn't collapse the sheet.
  const computeAndShowRoute = useCallback(
    async (request: PendingRouteRequest, options?: { keepOverviewOpen?: boolean }) => {
      const destinationPlace = places.find((place) => place.id === request.destinationPlaceId);
      if (!destinationPlace) return;

      const originEndpoint = await resolveRouteOrigin(
        request.origin,
        places,
        userLocation,
        requestLocation
      );
      if (!originEndpoint) {
        Alert.alert(
          "Location unavailable",
          "Enable location permissions in Settings, or choose a starting place instead of My Location."
        );
        return;
      }
      if (request.origin.type === "currentLocation") {
        setUserLocation(originEndpoint.coordinate);
      }

      const route = await routeRepository.getRoute({
        origin: originEndpoint,
        destination: placeToDestinationEndpoint(destinationPlace),
        destinationEntrances: destinationPlace.entrances,
        preference: request.preference,
      });

      setSelectedPlace(null);
      setActiveRoute(route);
      setRouteDestination(destinationPlace);
      setLastRouteRequest(request);
      if (!options?.keepOverviewOpen) {
        setRouteOverviewVisible(false);
      }
      mapRef.current?.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
        animated: true,
      });

      setPassedPlaces(
        findPlacesAlongRoute(route.coordinates, places, {
          excludeIds: new Set([destinationPlace.id]),
        })
      );

      // Surface relevant campus reports for this route without ever letting
      // a single unverified report silently change where the route goes.
      const allReports = await reportRepository.getAllReports();
      setRelevantReports(
        evaluateReportsForRoute({
          routeCoordinates: route.coordinates,
          reports: allReports,
          destinationPlaceId: destinationPlace.id,
          destinationEntranceIds: destinationPlace.entrances.map((entrance) => entrance.id),
          constructionZones,
        })
      );
    },
    [places, userLocation, requestLocation, constructionZones]
  );

  const handleDirections = useCallback(
    (place: Place) => {
      computeAndShowRoute({
        origin: { type: "currentLocation" },
        destinationPlaceId: place.id,
        preference: prefersAccessibleRouting ? "accessible" : "fastest",
      });
    },
    [computeAndShowRoute, prefersAccessibleRouting]
  );

  function handleChangePreference(preference: RoutePreference) {
    if (!lastRouteRequest) return;
    computeAndShowRoute({ ...lastRouteRequest, preference }, { keepOverviewOpen: true });
  }

  function handleFindAlternativeRoute() {
    if (!lastRouteRequest || !alternativeSuggestion) return;
    computeAndShowRoute(
      { ...lastRouteRequest, preference: alternativeSuggestion.preference },
      { keepOverviewOpen: true }
    );
  }

  function handleClearRoute() {
    setActiveRoute(null);
    setRouteDestination(null);
    setRouteOverviewVisible(false);
    setLastRouteRequest(null);
    setRelevantReports([]);
    setPassedPlaces([]);
  }

  function handleOpenPassedPlace(place: Place) {
    setRouteOverviewVisible(false);
    handleOpenDetail(place);
  }

  async function narrate(text: string, ms: number) {
    setDemoMessage(text);
    await sleep(ms);
  }

  function handleExitDemo() {
    demoCancelledRef.current = true;
    setDemoActive(false);
    setDemoMessage(null);
    setSearchQuery("");
    handleClearRoute();
    setSelectedPlace(null);
  }

  // Drives the exact same handlers a real user tap would — nothing here is
  // faked UI, it's the live app stepping through itself. Requires almost no
  // manual navigation, per the "one button" demo requirement.
  async function runDemoMode() {
    if (demoActive) return;
    demoCancelledRef.current = false;
    setDemoActive(true);

    const origin = places.find((place) => place.id === DEMO_ORIGIN_PLACE_ID);
    const destination = places.find((place) => place.id === DEMO_DESTINATION_PLACE_ID);
    if (!origin || !destination) {
      handleExitDemo();
      return;
    }

    await narrate(`📍 Welcome to ${campus?.name ?? "campus"}.`, 2200);
    if (demoCancelledRef.current) return;

    mapRef.current?.animateToRegion(
      { latitude: origin.latitude, longitude: origin.longitude, latitudeDelta: 0.0025, longitudeDelta: 0.0025 },
      900
    );
    await narrate(`🏰 ${origin.officialName} — where every campus tour starts.`, 2400);
    if (demoCancelledRef.current) return;

    setSearchQuery("coffee");
    await narrate("Let's find coffee...", 1600);
    if (demoCancelledRef.current) return;

    setSearchQuery("");
    handleSelectPlace(destination);
    await narrate(`☕ ${destination.officialName} — run by student staff.`, 2200);
    if (demoCancelledRef.current) return;

    await computeAndShowRoute({
      origin: { type: "place", placeId: origin.id },
      destinationPlaceId: destination.id,
      preference: "fastest",
    });
    setRouteOverviewVisible(true);
    await narrate(`🚶 Here's the fastest route from ${origin.officialName}.`, 2400);
    if (demoCancelledRef.current) return;

    await narrate("⚠️ We found construction ahead on this route.", 2400);
    if (demoCancelledRef.current) return;

    await computeAndShowRoute(
      {
        origin: { type: "place", placeId: origin.id },
        destinationPlaceId: destination.id,
        preference: "accessible",
      },
      { keepOverviewOpen: true }
    );
    await narrate("♿ Comparing the accessible route instead.", 2600);
    if (demoCancelledRef.current) return;

    await narrate(`🎉 You've arrived at ${destination.officialName}.`, 2200);
    if (demoCancelledRef.current) return;

    const tip = destination.studentTips[0];
    if (tip) {
      await narrate(`💡 Student tip: ${tip}`, 3400);
      if (demoCancelledRef.current) return;
    }

    await narrate("✨ That's Integrate. Thanks for watching!", 2600);

    if (!demoCancelledRef.current) {
      handleExitDemo();
    }
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

  // Directions requested from a screen other than the map (place detail, the
  // route planner): those screens signal the request here and hand control
  // back to the map, which is the only place that actually draws a route.
  useEffect(() => {
    if (!pendingRequest) return;
    clearPendingRequest();
    computeAndShowRoute(pendingRequest);
  }, [pendingRequest, clearPendingRequest, computeAndShowRoute]);

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
          {isSearching && (
            <View style={styles.searchResultsWrapper}>
              <SearchResultsList
                results={searchResults}
                userLocation={userLocation}
                onSelectPlace={handleSelectSearchResult}
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      {!demoActive && (
        <View style={styles.floatingButtonStack} pointerEvents="box-none">
          <IconButton
            icon="play-circle"
            accessibilityLabel="Run guided demo"
            onPress={runDemoMode}
            active
          />
          <IconButton
            icon="information-circle-outline"
            accessibilityLabel="Map legend"
            onPress={() => setLegendVisible(true)}
          />
          <IconButton
            icon="navigate-outline"
            accessibilityLabel="Plan a route"
            onPress={handlePlanRoute}
          />
          <IconButton
            icon="locate"
            accessibilityLabel="Center map on my current location"
            onPress={handleLocatePress}
            active={isLocating}
          />
        </View>
      )}

      {demoActive && <DemoBanner message={demoMessage} onExit={handleExitDemo} />}

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
          relevantReports={relevantReports}
          onPress={() => setRouteOverviewVisible(true)}
          onClose={handleClearRoute}
        />
      )}

      <RouteOverviewSheet
        visible={routeOverviewVisible && !!activeRoute}
        route={activeRoute}
        destinationName={routeDestination?.officialName ?? ""}
        passedPlaces={passedPlaces}
        relevantReports={relevantReports}
        alternativeSuggestion={alternativeSuggestion}
        onChangePreference={handleChangePreference}
        onClose={() => setRouteOverviewVisible(false)}
        onClearRoute={handleClearRoute}
        onReportIssue={handleReportRouteIssue}
        onFindAlternativeRoute={handleFindAlternativeRoute}
        onOpenPassedPlace={handleOpenPassedPlace}
      />

      <ConstructionDetailSheet
        zone={selectedConstructionZone}
        places={places}
        onClose={() => setSelectedConstructionZone(null)}
        onReportUpdate={handleReportConstructionUpdate}
      />

      <MapLegend visible={legendVisible} onClose={() => setLegendVisible(false)} />

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
  searchResultsWrapper: {
    marginTop: spacing.sm,
    maxHeight: 340,
  },
  floatingButtonStack: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    gap: spacing.sm,
  },
});
