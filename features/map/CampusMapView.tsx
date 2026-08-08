import { forwardRef, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import MapView, { Marker, Polyline, type MapPressEvent, type PoiClickEvent, type Region } from "react-native-maps";
import type { Campus, CampusEvent, ConstructionZone, LatLng, MockCampusUser, Place, Proposal, Route } from "@/types";
import { colors, radii, shadow } from "@/constants/theme";
import { PlaceMarker } from "./PlaceMarker";
import { EventMarker } from "./EventMarker";
import { UserMarker } from "./UserMarker";
import { ConstructionZoneOverlay } from "./ConstructionZoneOverlay";
import { AccessibleEntranceMarker } from "./AccessibleEntranceMarker";
import { PendingProposalOverlay } from "@/features/edits/PendingProposalOverlay";
import { isPastEvent } from "@/features/events/eventDate";

export interface MapPoiSelection {
  name: string;
  coordinate: LatLng;
}

interface CampusMapViewProps {
  campus: Campus;
  places: Place[];
  constructionZones: ConstructionZone[];
  pendingProposals: Proposal[];
  events: CampusEvent[];
  users: MockCampusUser[];
  showConstruction: boolean;
  showAccessibleEntrances: boolean;
  showEvents: boolean;
  showUsers: boolean;
  selectedPlaceId: string | null;
  /** True while a search query is narrowing `places` — forces labels on for every result, bypassing zoom culling. */
  searchActive: boolean;
  activeRoute?: Route | null;
  /** In-progress tap points while reporting a new construction zone, not yet submitted. */
  draftCoordinates?: LatLng[];
  onSelectPlace: (place: Place) => void;
  onSelectConstructionZone: (zone: ConstructionZone) => void;
  onSelectProposal: (proposal: Proposal) => void;
  onSelectEvent: (event: CampusEvent, place: Place) => void;
  onSelectUser: (user: MockCampusUser) => void;
  onMapPress: (coordinate: LatLng) => void;
  /**
   * Tapping a titled point of interest baked into the map tiles themselves
   * (e.g. "Copley Hall", "Boarman Family Cemetery") — the name comes
   * straight from the map SDK, not a guess. iOS only fires this with the
   * Google Maps provider; Apple Maps doesn't expose POI taps at all here.
   */
  onSelectPoi?: (poi: MapPoiSelection) => void;
}

interface MapSize {
  width: number;
  height: number;
}

interface ScreenPoint {
  x: number;
  y: number;
}

/** Always keep at least this many labels on screen, collisions or not. */
const MIN_VISIBLE_LABELS = 3;
/** Half the estimated label pill height in points, incl. a small buffer. */
const LABEL_HALF_HEIGHT = 12;

/** Rough label pill half-width from character count — matches PlaceMarker's `labelPill` sizing. */
function estimateLabelHalfWidth(text: string): number {
  return Math.min(130, 16 + text.length * 6.5) / 2;
}

/** Approximate on-screen position of a place, given the map's current region and rendered size. */
function toScreenPoint(place: Place, region: Region, mapSize: MapSize): ScreenPoint {
  const pointsPerLng = mapSize.width / region.longitudeDelta;
  const pointsPerLat = mapSize.height / region.latitudeDelta;
  return {
    x: (place.longitude - region.longitude) * pointsPerLng + mapSize.width / 2,
    y: (region.latitude - place.latitude) * pointsPerLat + mapSize.height / 2,
  };
}

function labelsOverlap(
  a: ScreenPoint & { halfWidth: number },
  b: ScreenPoint & { halfWidth: number }
): boolean {
  return (
    Math.abs(a.x - b.x) < a.halfWidth + b.halfWidth &&
    Math.abs(a.y - b.y) < LABEL_HALF_HEIGHT * 2
  );
}

/**
 * Which places should show a label right now. Greedily walks `places` in
 * priority order (selected place first, then declaration order in
 * data/places.ts) and accepts a label only if its estimated screen-space
 * bounding box doesn't overlap one already accepted — so two nearby pins
 * never show overlapping text at any zoom. The first MIN_VISIBLE_LABELS are
 * exempt from collision checks so there's always something to read even
 * fully zoomed out.
 */
function computeLabelVisiblePlaceIds(
  places: Place[],
  region: Region,
  mapSize: MapSize | null,
  searchActive: boolean,
  selectedPlaceId: string | null
): Set<string> {
  if (searchActive) return new Set(places.map((place) => place.id));
  if (!mapSize || mapSize.width === 0 || mapSize.height === 0) {
    return new Set(places.slice(0, MIN_VISIBLE_LABELS).map((place) => place.id));
  }

  const ordered = selectedPlaceId
    ? [
        ...places.filter((place) => place.id === selectedPlaceId),
        ...places.filter((place) => place.id !== selectedPlaceId),
      ]
    : places;

  const accepted: Array<ScreenPoint & { halfWidth: number }> = [];
  const visible = new Set<string>();

  ordered.forEach((place, index) => {
    const box = {
      ...toScreenPoint(place, region, mapSize),
      halfWidth: estimateLabelHalfWidth(place.localName ?? place.officialName),
    };
    const guaranteed = place.id === selectedPlaceId || index < MIN_VISIBLE_LABELS;
    const collides = accepted.some((other) => labelsOverlap(box, other));

    if (guaranteed || !collides) {
      accepted.push(box);
      visible.add(place.id);
    }
  });

  return visible;
}

export const CampusMapView = forwardRef<MapView, CampusMapViewProps>(function CampusMapView(
  {
    campus,
    places,
    constructionZones,
    pendingProposals,
    events,
    users,
    showConstruction,
    showAccessibleEntrances,
    showEvents,
    showUsers,
    selectedPlaceId,
    searchActive,
    activeRoute,
    draftCoordinates,
    onSelectPlace,
    onSelectConstructionZone,
    onSelectProposal,
    onSelectEvent,
    onSelectUser,
    onMapPress,
    onSelectPoi,
  },
  ref
) {
  const [region, setRegion] = useState<Region>(campus.mapRegion);
  const [mapSize, setMapSize] = useState<MapSize | null>(null);

  useEffect(() => {
    setRegion(campus.mapRegion);
  }, [campus.id]);

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setMapSize({ width, height });
  }

  const visibleLabelPlaceIds = useMemo(
    () => computeLabelVisiblePlaceIds(places, region, mapSize, searchActive, selectedPlaceId),
    [places, region, mapSize, searchActive, selectedPlaceId]
  );

  // Resolves each event's locationId to a real place (and nudges the pin a
  // few meters off that place's own marker so the two don't sit exactly on
  // top of each other) — events whose locationId doesn't match a known
  // place are silently skipped rather than guessing a coordinate for them.
  const resolvedEvents = useMemo(() => {
    if (!showEvents) return [];
    return events
      .filter((event) => !isPastEvent(event.date))
      .map((event) => {
        const place = places.find((p) => p.id === event.locationId);
        if (!place) return null;
        const offsetDegrees = 0.00009; // ~10m
        return {
          event,
          place,
          coordinate: {
            latitude: place.latitude + offsetDegrees,
            longitude: place.longitude + offsetDegrees,
          },
        };
      })
      .filter((resolved): resolved is { event: CampusEvent; place: Place; coordinate: LatLng } => resolved !== null);
  }, [events, places, showEvents]);

  function handlePress(event: MapPressEvent) {
    onMapPress(event.nativeEvent.coordinate);
  }

  function handlePoiClick(event: PoiClickEvent) {
    onSelectPoi?.({ name: event.nativeEvent.name, coordinate: event.nativeEvent.coordinate });
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <MapView
        ref={ref}
        style={styles.map}
        initialRegion={campus.mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={handlePress}
        onPoiClick={handlePoiClick}
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

        {resolvedEvents.map(({ event, place, coordinate }) => (
          <EventMarker
            key={event.id}
            event={event}
            coordinate={coordinate}
            onPress={() => onSelectEvent(event, place)}
          />
        ))}

        {showUsers &&
          users.map((user) => <UserMarker key={user.id} user={user} onPress={onSelectUser} />)}

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
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
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
