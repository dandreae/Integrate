import { forwardRef, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import type { Campus, ConstructionZone, LatLng, Place, Route } from "@/types";
import { colors } from "@/constants/theme";
import { PlaceMarker } from "./PlaceMarker";
import { ConstructionZoneOverlay } from "./ConstructionZoneOverlay";
import { AccessibleEntranceMarker } from "./AccessibleEntranceMarker";

interface CampusMapViewProps {
  campus: Campus;
  places: Place[];
  constructionZones: ConstructionZone[];
  showConstruction: boolean;
  showAccessibleEntrances: boolean;
  selectedPlaceId: string | null;
  activeRoute?: Route | null;
  onSelectPlace: (place: Place) => void;
  onSelectConstructionZone: (zone: ConstructionZone) => void;
  onMapPress: () => void;
}

const ROUTE_DRAW_DURATION_MS = 700;
const SEGMENTS_PER_LEG = 16;

/** Interpolates extra points between each leg so the reveal animation looks like a drawn line, not a 2-4 point jump. */
function densifyPath(path: LatLng[]): LatLng[] {
  if (path.length < 2) return path;
  const result: LatLng[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const start = path[i - 1];
    const end = path[i];
    for (let step = 1; step <= SEGMENTS_PER_LEG; step++) {
      const t = step / SEGMENTS_PER_LEG;
      result.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
  }
  return result;
}

export const CampusMapView = forwardRef<MapView, CampusMapViewProps>(function CampusMapView(
  {
    campus,
    places,
    constructionZones,
    showConstruction,
    showAccessibleEntrances,
    selectedPlaceId,
    activeRoute,
    onSelectPlace,
    onSelectConstructionZone,
    onMapPress,
  },
  ref
) {
  const [revealedRoute, setRevealedRoute] = useState<LatLng[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!activeRoute) {
      setRevealedRoute([]);
      return;
    }

    const densified = densifyPath(activeRoute.coordinates);
    const totalPoints = densified.length;
    const startTime = Date.now();

    function step() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / ROUTE_DRAW_DURATION_MS);
      const count = Math.max(2, Math.round(totalPoints * progress));
      setRevealedRoute(densified.slice(0, count));
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    }
    step();

    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
    // Re-run whenever a (new) route is computed — including recomputes for a
    // different preference or "Find another route" — so the line always
    // draws itself in, rather than just on the very first route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoute?.id]);

  return (
    <MapView
      ref={ref}
      style={styles.map}
      initialRegion={campus.mapRegion}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      onPress={onMapPress}
      accessibilityLabel={`Map of ${campus.name}`}
    >
      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          selected={place.id === selectedPlaceId}
          onPress={onSelectPlace}
        />
      ))}

      {showConstruction &&
        constructionZones.map((zone) => (
          <ConstructionZoneOverlay key={zone.id} zone={zone} onPress={onSelectConstructionZone} />
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

      {revealedRoute.length > 0 && (
        <Polyline coordinates={revealedRoute} strokeColor={colors.accent} strokeWidth={4} zIndex={3} />
      )}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
