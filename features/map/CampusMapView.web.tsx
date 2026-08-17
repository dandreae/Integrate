import { Fragment, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import type LType from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import type {
  Campus,
  CampusEvent,
  ConstructionZone,
  ConstructionZoneProposalPayload,
  LatLng,
  MockCampusUser,
  Place,
  Proposal,
  RenameProposalPayload,
  Route,
} from "@/types";
import { ACCESSIBLE_ENTRANCE_META, CONSTRUCTION_META, EVENT_CATEGORY_META, PLACE_CATEGORY_META } from "@/constants/categories";
import { colors } from "@/constants/theme";
import { isPastEvent } from "@/features/events/eventDate";
import { buildAvatarIcon, buildBadgeIcon, buildDraftPointIcon } from "./web/mapIcons";
import { edgePaddingToLeafletPadding, regionToZoom, toLatLngTuple } from "./web/mapGeo";

// Web-only build of the map screen. react-native-maps (what the native
// CampusMapView is built on) has no web implementation, so this is a
// separate, self-contained implementation on Leaflet + free OpenStreetMap
// tiles — no API key, consistent with every other network dependency in
// this app (Valhalla routing, Photon/Overpass geocoding). Metro picks this
// file automatically for web builds via the .web.tsx suffix; the native
// file (CampusMapView.tsx) is untouched and still used for iOS/Android.
//
// Deliberately NOT a pixel-perfect port: label collision-avoidance and the
// native "blue dot" live location indicator are native-only conveniences
// that don't have a cheap web equivalent, so this always shows place labels
// (a browser canvas is roomier than a phone screen) and skips a persistent
// user-location marker. Every functional path — search, directions, filters,
// accessibility reports, events, friends — works the same as native.

const PLACE_CATEGORY_GLYPH: Record<Place["category"], string> = {
  academic: "🎓",
  dining: "🍽️",
  coffee: "☕",
  study: "📚",
  landmark: "🚩",
  grocery: "🛒",
  parking: "🅿️",
  resource: "❤️",
  gathering: "👥",
};

const EVENT_CATEGORY_GLYPH: Record<CampusEvent["category"], string> = {
  sports: "🏆",
  concert: "🎵",
  social: "👥",
  academic: "🎓",
  market: "🛒",
  meeting: "💬",
  other: "📅",
};

export interface WebMapViewHandle {
  animateToRegion: (region: Campus["mapRegion"], duration?: number) => void;
  fitToCoordinates: (
    coordinates: LatLng[],
    options?: { edgePadding?: { top?: number; right?: number; bottom?: number; left?: number }; animated?: boolean }
  ) => void;
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
  searchActive: boolean;
  activeRoute?: Route | null;
  draftCoordinates?: LatLng[];
  onSelectPlace: (place: Place) => void;
  onSelectConstructionZone: (zone: ConstructionZone) => void;
  onSelectProposal: (proposal: Proposal) => void;
  onSelectEvent: (event: CampusEvent) => void;
  onSelectUser: (user: MockCampusUser) => void;
  onMapPress: (coordinate: LatLng) => void;
  /** No web equivalent — OSM raster tiles don't expose clickable POI labels the way native map SDKs do. Never called on web. */
  onSelectPoi?: (poi: { name: string; coordinate: LatLng }) => void;
}

function MapClickHandler({ onMapPress }: { onMapPress: (coordinate: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onMapPress({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

export const CampusMapView = forwardRef<WebMapViewHandle, CampusMapViewProps>(function CampusMapView(
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
    activeRoute,
    draftCoordinates,
    onSelectPlace,
    onSelectConstructionZone,
    onSelectProposal,
    onSelectEvent,
    onSelectUser,
    onMapPress,
  },
  ref
) {
  const leafletMapRef = useRef<LType.Map | null>(null);

  useEffect(() => {
    leafletMapRef.current?.setView(toLatLngTuple(campus.mapRegion), regionToZoom(campus.mapRegion));
    // Only campus switches reset the view — the map's own pan/zoom shouldn't fight the user afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus.id]);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion(region, duration) {
        leafletMapRef.current?.flyTo(toLatLngTuple(region), regionToZoom(region), {
          duration: Math.max(0.1, (duration ?? 500) / 1000),
        });
      },
      fitToCoordinates(coordinates, options) {
        const map = leafletMapRef.current;
        if (!map || coordinates.length === 0) return;
        const bounds = coordinates.map(toLatLngTuple);
        map.fitBounds(bounds, {
          ...edgePaddingToLeafletPadding(options?.edgePadding),
          animate: options?.animated ?? true,
        });
      },
    }),
    []
  );

  // Same +/-10m nudge as native, so an event marker never sits exactly on
  // top of its place's own pin. Every event an EventRepository returns
  // already has a resolved coordinate (services/events/eventLocationResolver.ts).
  const resolvedEvents = useMemo(() => {
    if (!showEvents) return [];
    const offsetDegrees = 0.00009;
    return events
      .filter((event) => !isPastEvent(event.date) && event.coordinate)
      .map((event) => ({
        event,
        coordinate: {
          latitude: event.coordinate!.latitude + offsetDegrees,
          longitude: event.coordinate!.longitude + offsetDegrees,
        },
      }));
  }, [events, showEvents]);

  const visibleAccessibleEntrances = useMemo(() => {
    if (!showAccessibleEntrances) return [];
    return places.flatMap((place) => place.entrances.filter((entrance) => entrance.isAccessible));
  }, [places, showAccessibleEntrances]);

  return (
    <View style={styles.container}>
      <MapContainer
        ref={leafletMapRef}
        center={toLatLngTuple(campus.mapRegion)}
        zoom={regionToZoom(campus.mapRegion)}
        // A plain DOM style object, not StyleSheet.create() — MapContainer is a
        // regular react-leaflet/DOM component, not a react-native-web primitive.
        style={{ height: "100%", width: "100%" }}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapClickHandler onMapPress={onMapPress} />

        {places.map((place) => (
          <Marker
            key={place.id}
            position={toLatLngTuple(place)}
            icon={buildBadgeIcon({
              color: PLACE_CATEGORY_META[place.category].color,
              glyph: PLACE_CATEGORY_GLYPH[place.category],
              selected: place.id === selectedPlaceId,
            })}
            eventHandlers={{ click: () => onSelectPlace(place) }}
          >
            <Tooltip permanent direction="top" offset={[0, -16]} opacity={0.95} className="integrate-map-tooltip">
              {place.localName ?? place.officialName}
            </Tooltip>
          </Marker>
        ))}

        {showConstruction &&
          constructionZones.map((zone) => {
            const midIndex = Math.floor(zone.coordinates.length / 2);
            const labelCoordinate = zone.coordinates[midIndex];
            if (!labelCoordinate) return null;
            return (
              <Fragment key={zone.id}>
                <Polyline
                  positions={zone.coordinates.map(toLatLngTuple)}
                  pathOptions={{ color: CONSTRUCTION_META.color, weight: 4, dashArray: "10 6" }}
                />
                <Marker
                  position={toLatLngTuple(labelCoordinate)}
                  icon={buildBadgeIcon({ color: CONSTRUCTION_META.color, glyph: "🚧", square: true })}
                  eventHandlers={{ click: () => onSelectConstructionZone(zone) }}
                />
              </Fragment>
            );
          })}

        {pendingProposals.map((proposal) => {
          if (proposal.type === "rename") {
            const payload = proposal.payload as RenameProposalPayload;
            const place = places.find((candidate) => candidate.id === payload.placeId);
            if (!place) return null;
            return (
              <Marker
                key={proposal.id}
                position={toLatLngTuple(place)}
                icon={buildBadgeIcon({ color: colors.accent, glyph: "✏️" })}
                eventHandlers={{ click: () => onSelectProposal(proposal) }}
              />
            );
          }
          const payload = proposal.payload as ConstructionZoneProposalPayload;
          const midIndex = Math.floor(payload.coordinates.length / 2);
          const labelCoordinate = payload.coordinates[midIndex];
          if (!labelCoordinate) return null;
          return (
            <Fragment key={proposal.id}>
              <Polyline
                positions={payload.coordinates.map(toLatLngTuple)}
                pathOptions={{ color: CONSTRUCTION_META.color, weight: 3, dashArray: "4 8" }}
              />
              <Marker
                position={toLatLngTuple(labelCoordinate)}
                icon={buildBadgeIcon({ color: CONSTRUCTION_META.color, glyph: "🚧", square: true })}
                eventHandlers={{ click: () => onSelectProposal(proposal) }}
              />
            </Fragment>
          );
        })}

        {resolvedEvents.map(({ event, coordinate }) => (
          <Marker
            key={event.id}
            position={toLatLngTuple(coordinate)}
            icon={buildBadgeIcon({
              color: EVENT_CATEGORY_META[event.category].color,
              glyph: EVENT_CATEGORY_GLYPH[event.category],
              square: true,
            })}
            eventHandlers={{ click: () => onSelectEvent(event) }}
          />
        ))}

        {showUsers &&
          users.map((user) => (
            <Marker
              key={user.id}
              position={toLatLngTuple(user.currentLocation)}
              icon={buildAvatarIcon({ color: user.avatarColor, initials: user.avatarInitials })}
              eventHandlers={{ click: () => onSelectUser(user) }}
            />
          ))}

        {visibleAccessibleEntrances.map((entrance) => (
          <Marker
            key={entrance.id}
            position={toLatLngTuple(entrance)}
            icon={buildBadgeIcon({ color: ACCESSIBLE_ENTRANCE_META.color, glyph: "♿", size: 22 })}
          />
        ))}

        {activeRoute && (
          <Polyline positions={activeRoute.coordinates.map(toLatLngTuple)} pathOptions={{ color: colors.accent, weight: 4 }} />
        )}

        {draftCoordinates && draftCoordinates.length > 0 && (
          <>
            <Polyline positions={draftCoordinates.map(toLatLngTuple)} pathOptions={{ color: colors.accent, weight: 3 }} />
            {draftCoordinates.map((coordinate, index) => (
              <Marker key={index} position={toLatLngTuple(coordinate)} icon={buildDraftPointIcon()} />
            ))}
          </>
        )}
      </MapContainer>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
