import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { Place } from "@/types";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

interface PlaceMarkerProps {
  place: Place;
  selected: boolean;
  /** Whether zoom level / active search says this place's label should be visible. Selection always wins regardless. */
  showLabel: boolean;
  onPress: (place: Place) => void;
}

function PlaceMarkerComponent({ place, selected, showLabel, onPress }: PlaceMarkerProps) {
  const meta = PLACE_CATEGORY_META[place.category];
  const labelVisible = selected || showLabel;

  // react-native-maps only re-snapshots a custom marker's native image while
  // tracksViewChanges is true, so we flash it on for a moment whenever the
  // label toggles, then drop it back to false — leaving it on permanently
  // for every visible-label marker would hurt Android scroll/zoom perf.
  const [tracking, setTracking] = useState(labelVisible);
  useEffect(() => {
    setTracking(true);
    const timeout = setTimeout(() => setTracking(false), 300);
    return () => clearTimeout(timeout);
  }, [labelVisible]);

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      onPress={() => onPress(place)}
      tracksViewChanges={tracking}
      accessibilityLabel={`${place.officialName}${place.localName ? `, also called ${place.localName}` : ""}, ${meta.label}`}
      zIndex={selected ? 10 : 1}
    >
      {labelVisible && (
        <View style={styles.labelPill}>
          <Text style={styles.labelText} numberOfLines={1}>
            {place.localName ?? place.officialName}
          </Text>
        </View>
      )}
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
  labelPill: {
    alignSelf: "center",
    maxWidth: 130,
    marginBottom: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  labelText: {
    ...typography.label,
    color: colors.textPrimary,
  },
  pin: {
    alignSelf: "center",
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
