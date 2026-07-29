import { forwardRef, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, type MapPressEvent, type Region } from "react-native-maps";
import type { Campus, ConstructionZone, LatLng, Place, Proposal, Route } from "@/types";
import { colors, radii, shadow } from "@/constants/theme";
import { PlaceMarker } from "./PlaceMarker";
import { ConstructionZoneOverlay } from "./ConstructionZoneOverlay";
import { AccessibleEntranceMarker } from "./AccessibleEntranceMarker";
import { PendingProposalOverlay } from "@/features/edits/PendingProposalOverlay";

interface CampusMapViewProps {
  campus: Campus;
  places: Place[];
  constructionZones: ConstructionZone[];
  pendingProposals: Proposal[];
  showConstruction: boolean;
  showAccessibleEntrances: boolean;
  selectedPlaceId: string | null;
  /** True while a search query is narrowing `places` — forces labels on for every result, bypassing zoom culling. */
  searchActive: boolean;
  activeRoute?: Route | null;
  /** In-progress tap points while reporting a new construction zone, not yet submitted. */
  draftCoordinates?: LatLng[];
  onSelectPlace: (place: Place) => void;
  onSelectConstructionZone: (zone: ConstructionZone) => void;
  onSelectProposal: (proposal: Proposal) => void;
  onMapPress: (coordinate: LatLng) => void;
}

/**
 * How many place labels stay on screen at once, keyed by zoom (smaller
 * latitudeDelta = more zoomed in). Mirrors Apple/Google Maps-style POI label
 * thinning: fewer labels zoomed out, more zoomed in, but never zero.
 */
function maxLabelsForZoom(latitudeDelta: number): number {
  if (latitudeDelta >= 0.05) return 3;
  if (latitudeDelta >= 0.02) return 6;
  if (latitudeDelta >= 0.008) return 12;
  return Infinity;
}

/**
 * Which places should show a label right now. Priority when culling is just
 * `places` array order (i.e. declaration order in data/places.ts) — reorder
 * that file to change which pins surface first when zoomed out.
 */
function computeLabelVisiblePlaceIds(
  places: Place[],
  latitudeDelta: number,
  searchActive: boolean
): Set<string> {
  if (searchActive) return new Set(places.map((place) => place.id));
  const max = maxLabelsForZoom(latitudeDelta);
  return new Set(places.slice(0, max).map((place) => place.id));
}

export const CampusMapView = forwardRef<MapView, CampusMapViewProps>(function CampusMapView(
  {
    campus,
    places,
    constructionZones,
    pendingProposals,
    showConstruction,
    showAccessibleEntrances,
    selectedPlaceId,
    searchActive,
    activeRoute,
    draftCoordinates,
    onSelectPlace,
    onSelectConstructionZone,
    onSelectProposal,
    onMapPress,
  },
  ref
) {
  const [region, setRegion] = useState<Region>(campus.mapRegion);

  useEffect(() => {
    setRegion(campus.mapRegion);
  }, [campus.id]);

  const visibleLabelPlaceIds = useMemo(
    () => computeLabelVisiblePlaceIds(places, region.latitudeDelta, searchActive),
    [places, region.latitudeDelta, searchActive]
  );

  function handlePress(event: MapPressEvent) {
    onMapPress(event.nativeEvent.coordinate);
  }

  return (
    <MapView
      ref={ref}
      style={styles.map}
      initialRegion={campus.mapRegion}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      onPress={handlePress}
      onRegionChangeComplete={setRegion}
      accessibilityLabel={`Map of ${campus.name}`}
    >
      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          selected={place.id === selectedPlaceId}
          showLabel={visibleLabelPlaceIds.has(place.id)}
          onPress={onSelectPlace}
        />
      ))}

      {showConstruction &&
        constructionZones.map((zone) => (
          <ConstructionZoneOverlay key={zone.id} zone={zone} onPress={onSelectConstructionZone} />
        ))}

      {pendingProposals.map((proposal) => (
        <PendingProposalOverlay
          key={proposal.id}
          proposal={proposal}
          places={places}
          onPress={onSelectProposal}
        />
      ))}

      {showAccessibleEntrances &&
        places.flatMap((place) =>
          place.entrances
            .filter((entrance) => entrance.isAccessible)
            .map((entrance) => (
              <AccessibleEntranceMarker
                key={entrance.id}
                entrance={entrance}
                placeName={place.officialName}
              />
            ))
        )}

      {activeRoute && (
        <Polyline
          coordinates={activeRoute.coordinates}
          strokeColor={colors.accent}
          strokeWidth={4}
          zIndex={3}
        />
      )}

      {draftCoordinates && draftCoordinates.length > 0 && (
        <>
          <Polyline coordinates={draftCoordinates} strokeColor={colors.accent} strokeWidth={3} zIndex={7} />
          {draftCoordinates.map((coordinate, index) => (
            <Marker key={index} coordinate={coordinate} tracksViewChanges={false} zIndex={8}>
              <View style={styles.draftPoint} />
            </Marker>
          ))}
        </>
      )}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: colors.background,
  },
  draftPoint: {
    width: 14,
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.card,
  },
});
