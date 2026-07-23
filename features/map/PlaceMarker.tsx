import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { Place } from "@/types";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, shadow } from "@/constants/theme";

interface PlaceMarkerProps {
  place: Place;
  selected: boolean;
  onPress: (place: Place) => void;
}

function PlaceMarkerComponent({ place, selected, onPress }: PlaceMarkerProps) {
  const meta = PLACE_CATEGORY_META[place.category];

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      onPress={() => onPress(place)}
      tracksViewChanges={false}
      accessibilityLabel={`${place.officialName}${place.localName ? `, also called ${place.localName}` : ""}, ${meta.label}`}
      zIndex={selected ? 10 : 1}
    >
      <View
        style={[
          styles.pin,
          { backgroundColor: meta.color },
          selected && styles.pinSelected,
        ]}
      >
        <Ionicons name={meta.icon} size={16} color={colors.textInverse} />
      </View>
      {selected && <View style={[styles.pinStem, { borderTopColor: meta.color }]} />}
    </Marker>
  );
}

export const PlaceMarker = memo(PlaceMarkerComponent);

const styles = StyleSheet.create({
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.card,
  },
  pinSelected: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  pinStem: {
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
