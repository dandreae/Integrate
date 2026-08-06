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
  RouteOption,
  RoutePreference,
} from "@/types";
import { CampusMapView, type MapPoiSelection } from "@/features/map/CampusMapView";
import { MapSearchBar } from "@/features/map/MapSearchBar";
import { MapFilterSheet, type MapFilterState } from "@/features/map/MapFilterSheet";
import { SearchResultsList } from "@/features/map/SearchResultsList";
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
  expandNicknameAlias,
  fetchNearbyNamedFeatures,
  geocodingProvider,
  looksLikeAbbreviation,
  matchesAbbreviation,
  toDroppedPinPlace,
  toSyntheticPlace,
  type GeocodeResult,
} from "@/services/geocoding";
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
  /** Timestamp of the last marker/overlay tap — see handleMapPress for why. */
  const lastOverlayPressRef = useRef(0);
  const { requestLocation, isLocating } = useCurrentLocation();

  const pendingDestinationId = useDirectionsStore((state) => state.pendingDestinationId);
  const pendingOriginId = useDirectionsStore((state) => state.pendingOriginId);
  const clearPendingDestination = useDirectionsStore((state) => state.clearPendingDestination);

  const [campus, setCampus] = useState<Campus | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [seedConstructionZones, setSeedConstructionZones] = useState<ConstructionZone[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [externalSearchResults, setExternalSearchResults] = useState<Place[]>([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [possibleAbbreviationMatches, setPossibleAbbreviationMatches] = useState<Place[]>([]);
  /** Every named building/amenity on campus, from live map data — the pool the abbreviation guesser checks against. Best-effort, fetched once. */
  const [nearbyFeatures, setNearbyFeatures] = useState<GeocodeResult[]>([]);
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [routeOptions, setRouteOptions] = useState<RouteOption[] | null>(null);
  const [selectedRoutePreference, setSelectedRoutePreference] = useState<RoutePreference>(
    prefersAccessibleRouting ? "accessible" : "fastest"
  );
  const [routeDestination, setRouteDestination] = useState<Place | null>(null);
  /** Name of the chosen origin place, when routing building-to-building instead of from the user's location. */
  const [routeOriginName, setRouteOriginName] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isResolvingTap, setIsResolvingTap] = useState(false);

  const activeRoute =
    routeOptions?.find((option) => option.preference === selectedRoutePreference)?.route ?? null;

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

  // Best-effort pool of every named building/amenity on campus, used only to
  // guess at abbreviations (e.g. "ICC") during search — never blocks or
  // affects normal search if it fails or is still loading.
  useEffect(() => {
    if (!campus) return;
    const { latitude, longitude, latitudeDelta, longitudeDelta } = campus.mapRegion;
    fetchNearbyNamedFeatures({
      south: latitude - latitudeDelta / 2,
      north: latitude + latitudeDelta / 2,
      west: longitude - longitudeDelta / 2,
      east: longitude + longitudeDelta / 2,
    }).then(setNearbyFeatures);
  }, [campus]);

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

  // Search results beyond Integrate's curated places (e.g. "Copley Hall"),
  // resolved via the map/geocoding service so users aren't limited to the
  // handful of buildings we've manually added. Debounced + request-order
  // guarded so a fast typist doesn't get a stale result flash in late.
  //
  // Deliberately biased to the CAMPUS center, not `userLocation` — a device
  // location simulator (or a student a few blocks off campus) can put
  // userLocation far enough away that every real on-campus match gets
  // discarded by the geocoder's own proximity relevance/distance filtering,
  // silently returning zero results with no error to show for it. This bit
  // us for real: the iOS Simulator here defaults to Cupertino, CA, ~3,800km
  // from Georgetown, which is exactly what was causing "Yates" to come up
  // empty. See the identical fix for routing coverage for the same reasoning.
  useEffect(() => {
    const query = searchQuery.trim();

    // Abbreviation guessing is local/instant (checked against the
    // pre-fetched nearby-features pool) — no reason to gate it behind the
    // same length/debounce as the network geocoding search below.
    if (query.length >= 2 && looksLikeAbbreviation(query)) {
      const curatedNames = new Set(overriddenPlaces.map((p) => p.officialName.toLowerCase()));
      const guesses = nearbyFeatures
        .filter((f) => matchesAbbreviation(query, f.name) && !curatedNames.has(f.name.toLowerCase()))
        .map((f) => toSyntheticPlace(f, selectedCampusId));
      setPossibleAbbreviationMatches(guesses);
    } else {
      setPossibleAbbreviationMatches([]);
    }

    if (query.length < 3 || !campus) {
      setExternalSearchResults([]);
      setIsSearchingExternal(false);
      return;
    }

    let cancelled = false;
    setIsSearchingExternal(true);
    const near = { latitude: campus.latitude, longitude: campus.longitude };
    // A known nickname (e.g. "ICC") gets searched under its real name too —
    // the alias only ever rewrites search TEXT, the coordinate that comes
    // back is always a live lookup, never a stored/guessed location.
    const alias = expandNicknameAlias(query);
    const timeout = setTimeout(async () => {
      const [directResults, aliasResults] = await Promise.all([
        geocodingProvider.search(query, near),
        alias ? geocodingProvider.search(alias, near) : Promise.resolve([]),
      ]);
      if (cancelled) return;

      const curatedNames = new Set(
        overriddenPlaces.map((p) => p.officialName.toLowerCase())
      );
      const seen = new Set<string>();
      const synthetic = [...directResults, ...aliasResults]
        .filter((r) => {
          const key = r.name.toLowerCase();
          if (curatedNames.has(key) || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((r) => toSyntheticPlace(r, selectedCampusId));

      setExternalSearchResults(synthetic);
      setIsSearchingExternal(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchQuery, campus, overriddenPlaces, selectedCampusId, nearbyFeatures]);

  // Don't show the same building twice if it's both a confirmed map match
  // and coincidentally initials-matches the query.
  const dedupedPossibleMatches = useMemo(() => {
    const confirmedNames = new Set(externalSearchResults.map((p) => p.officialName.toLowerCase()));
    return possibleAbbreviationMatches.filter((p) => !confirmedNames.has(p.officialName.toLowerCase()));
  }, [possibleAbbreviationMatches, externalSearchResults]);

  // While actively searching, show map/geocoding results as real pins on the
  // map too — not just rows in the dropdown — so "search finds it" and
  // "it's there on the map" are the same thing, not two disconnected UIs.
  const mapMarkerPlaces = useMemo(() => {
    const base =
      searchQuery.trim().length > 0 && externalSearchResults.length > 0
        ? [...filteredPlaces, ...externalSearchResults]
        : filteredPlaces;
    // Keep the selected pin visible even after the search that found it is
    // cleared (curated places already stay put; only non-curated results
    // disappear from `base` once the query resets, so patch that back in).
    if (selectedPlace && !base.some((p) => p.id === selectedPlace.id)) {
      return [...base, selectedPlace];
    }
    return base;
  }, [filteredPlaces, externalSearchResults, searchQuery, selectedPlace]);

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
    lastOverlayPressRef.current = Date.now();
    setRouteOptions(null);
    setRouteDestination(null);
    setRouteOriginName(null);
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

  // Lets users select ANY real building, not just the handful curated in
  // data/places.ts (e.g. Copley Hall) — resolves the tapped spot via the
  // map/geocoding service, falling back to a generic dropped pin if nothing
  // is nearby, so the interaction never dead-ends. Triggered by a plain tap
  // when the map is otherwise idle (see handleMapPress) — deliberately NOT
  // long-press: registering both onPress and onLongPress on the native map
  // makes the OS gesture recognizer delay every tap while it waits to see
  // whether it turns into a long-press, which made the whole map feel
  // sluggish to tap on.
  async function resolveAndSelectMapLocation(coordinate: LatLng) {
    if (isDroppingPoints) return;
    lastOverlayPressRef.current = Date.now();
    setIsResolvingTap(true);
    try {
      const result = await geocodingProvider.reverse(coordinate);
      const place = result ? toSyntheticPlace(result, selectedCampusId) : toDroppedPinPlace(coordinate, selectedCampusId);
      handleSelectPlace(place);
    } finally {
      setIsResolvingTap(false);
    }
  }

  // Tapping a titled point of interest baked into the map tiles themselves
  // (e.g. "Boarman Family Cemetery") — the name comes directly from the map
  // SDK, so this works for anything the map itself labels, not just what a
  // geocoder happens to index. iOS only fires this with the Google Maps
  // provider; on Apple Maps, long-press (above) is the fallback.
  function handleSelectPoi(poi: MapPoiSelection) {
    lastOverlayPressRef.current = Date.now();
    const place = toSyntheticPlace(
      { name: poi.name, latitude: poi.coordinate.latitude, longitude: poi.coordinate.longitude },
      selectedCampusId
    );
    handleSelectPlace(place);
  }

  function handleSelectSearchResult(place: Place) {
    setSearchQuery("");
    handleSelectPlace(place);
  }

  function handleSelectConstructionZone(zone: ConstructionZone) {
    lastOverlayPressRef.current = Date.now();
    Alert.alert(zone.title, zone.description);
  }

  function handleSelectProposal(proposal: Proposal) {
    lastOverlayPressRef.current = Date.now();
    router.push({ pathname: "/proposal/[id]", params: { id: proposal.id } });
  }

  function handleOpenDetail(place: Place) {
    router.push({ pathname: "/place/[id]", params: { id: place.id } });
  }

  const computeAndShowRoute = useCallback(
    async (origin: LatLng, destination: Place, originPlace?: Place) => {
      setSelectedPlace(null);
      setRouteDestination(destination);
      setRouteOriginName(originPlace?.officialName ?? null);
      setSelectedRoutePreference(prefersAccessibleRouting ? "accessible" : "fastest");
      setIsRouting(true);

      try {
        const options = await routeRepository.getRouteOptions({
          origin,
          destination: { latitude: destination.latitude, longitude: destination.longitude },
          destinationPlace: destination,
          originPlace,
          constructionZones,
        });
        setRouteOptions(options);

        const preferred = options.find(
          (o) => o.preference === (prefersAccessibleRouting ? "accessible" : "fastest")
        );
        const firstAvailable = options.find((o) => o.route);
        const toShow = preferred?.route ? preferred : firstAvailable;
        if (toShow?.route) {
          setSelectedRoutePreference(toShow.preference);
          mapRef.current?.fitToCoordinates(toShow.route.coordinates, {
            edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
            animated: false,
          });
        }
      } finally {
        setIsRouting(false);
      }
    },
    [prefersAccessibleRouting, constructionZones]
  );

  const handleDirections = useCallback(
    async (place: Place) => {
      const coords = userLocation ?? (await requestLocation());
      if (!coords) {
        Alert.alert(
          "Location unavailable",
          'Enable location permissions in Settings to get directions from where you are, or tap the swap icon next to Directions to route from another place instead.'
        );
        return;
      }
      setUserLocation(coords);
      await computeAndShowRoute(coords, place);
    },
    [userLocation, requestLocation, computeAndShowRoute]
  );

  const handleDirectionsBetween = useCallback(
    async (origin: Place, destination: Place) => {
      await computeAndShowRoute({ latitude: origin.latitude, longitude: origin.longitude }, destination, origin);
    },
    [computeAndShowRoute]
  );

  function handleSelectRoutePreference(preference: RoutePreference) {
    setSelectedRoutePreference(preference);
    const option = routeOptions?.find((o) => o.preference === preference);
    if (option?.route) {
      mapRef.current?.fitToCoordinates(option.route.coordinates, {
        edgePadding: { top: 100, right: 60, bottom: 220, left: 60 },
        animated: false,
      });
    }
  }

  function handleClearRoute() {
    setRouteOptions(null);
    setRouteDestination(null);
    setRouteOriginName(null);
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
    // react-native-maps (mainly Android) bubbles a marker/overlay tap through
    // to the underlying MapView's onPress too — without this guard, tapping a
    // pin immediately clears the selection it just set.
    if (Date.now() - lastOverlayPressRef.current < 150) return;

    // First tap dismisses whatever's already open (matches how the close
    // button/route-clear already behave). Only once the map is idle does a
    // plain tap resolve the tapped spot to a place — this is what lets
    // users route to any point on the map, not just curated markers,
    // without a tap-to-dismiss turning into an unwanted new selection.
    if (selectedPlace || routeOptions) {
      setSelectedPlace(null);
      handleClearRoute();
      return;
    }

    resolveAndSelectMapLocation(coordinate);
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
    const destination = overriddenPlaces.find((candidate) => candidate.id === pendingDestinationId);
    const origin = pendingOriginId
      ? overriddenPlaces.find((candidate) => candidate.id === pendingOriginId)
      : null;
    clearPendingDestination();
    if (!destination) return;
    if (origin) {
      handleDirectionsBetween(origin, destination);
    } else {
      handleDirections(destination);
    }
  }, [
    pendingDestinationId,
    pendingOriginId,
    overriddenPlaces,
    clearPendingDestination,
    handleDirections,
    handleDirectionsBetween,
  ]);

  if (!campus) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <CampusMapView
        ref={mapRef}
        campus={campus}
        places={mapMarkerPlaces}
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
        onSelectPoi={handleSelectPoi}
      />

      <SafeAreaView style={styles.topOverlay} edges={["top"]} pointerEvents="box-none">
        <View style={styles.searchWrapper}>
          <MapSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFilterPress={() => setFilterSheetVisible(true)}
            filterActive={filtersActive}
          />
          {searchQuery.trim().length > 0 && !selectedPlace && (
            <SearchResultsList
              results={filteredPlaces}
              externalResults={externalSearchResults}
              possibleMatches={dedupedPossibleMatches}
              isSearchingExternal={isSearchingExternal}
              onSelect={handleSelectSearchResult}
            />
          )}
        </View>
      </SafeAreaView>

      {isRouting && (
        <View style={styles.routingBanner} pointerEvents="none">
          <Text style={styles.routingBannerText}>Finding walking route…</Text>
        </View>
      )}

      {isResolvingTap && (
        <View style={styles.routingBanner} pointerEvents="none">
          <Text style={styles.routingBannerText}>Looking up this location…</Text>
        </View>
      )}

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
          places={overriddenPlaces}
          distanceMeters={selectedPlaceDistanceMeters}
          onClose={() => setSelectedPlace(null)}
          onOpenDetail={handleOpenDetail}
          onDirections={handleDirections}
          onDirectionsFrom={handleDirectionsBetween}
        />
      )}

      {routeOptions && routeDestination && !selectedPlace && (
        <RouteSummaryBar
          destinationName={routeDestination.officialName}
          originName={routeOriginName}
          routeOptions={routeOptions}
          selectedPreference={selectedRoutePreference}
          onSelectPreference={handleSelectRoutePreference}
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
  routingBanner: {
    position: "absolute",
    top: 64,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadow.card,
  },
  routingBannerText: {
    ...typography.caption,
    color: colors.textSecondary,
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
