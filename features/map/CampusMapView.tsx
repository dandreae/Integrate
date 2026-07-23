import { forwardRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import type { Campus, ConstructionZone, Place, Route } from "@/types";
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

      {activeRoute && (
        <Polyline
          coordinates={activeRoute.coordinates}
          strokeColor={colors.accent}
          strokeWidth={4}
          zIndex={3}
        />
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
