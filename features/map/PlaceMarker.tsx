import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { Place } from "@/types";
import { PLACE_CATEGORY_META } from "@/constants/categories";
import { colors, shadow } from "@/constants/theme";
import { getPlaceTrustSignals } from "@/features/places/dataTrust";

interface PlaceMarkerProps {
  place: Place;
  selected: boolean;
  onPress: (place: Place) => void;
}

function PlaceMarkerComponent({ place, selected, onPress }: PlaceMarkerProps) {
  const meta = PLACE_CATEGORY_META[place.category];
  // Synchronous signals only (outdated / low-confidence) — report-based
  // signals need a fetch per place, which isn't worth doing for every
  // marker on screen at once. See PlacePreviewCard for the full picture.
  const hasTrustSignal = getPlaceTrustSignals(place, false).length > 0;

  // Landmarks get a slow, gentle "alive" pulse — deliberately limited to a
  // handful of markers (there are only ever a few landmarks per campus).
  // Continuous marker animation needs `tracksViewChanges`, which forces a
  // native re-snapshot per frame; doing that for every marker on screen
  // would visibly hitch, so this stays reserved for a small, bounded set.
  const isLandmark = place.category === "landmark";

  const selectionScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    selectionScale.value = withSpring(selected ? 1.22 : 1, { damping: 10, stiffness: 160 });
  }, [selected, selectionScale]);

  useEffect(() => {
    if (!isLandmark) return;
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [isLandmark, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectionScale.value * pulseScale.value }],
  }));

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      onPress={() => onPress(place)}
      tracksViewChanges={selected || isLandmark}
      accessibilityLabel={`${place.officialName}${place.localName ? `, also called ${place.localName}` : ""}, ${meta.label}${hasTrustSignal ? ", data may be outdated" : ""}`}
      zIndex={selected ? 10 : 1}
    >
      <Animated.View style={[styles.pin, { backgroundColor: meta.color }, animatedStyle]}>
        <Ionicons name={meta.icon} size={16} color={colors.textInverse} />
        {hasTrustSignal && <View style={styles.trustDot} />}
      </Animated.View>
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
  trustDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
    borderWidth: 1.5,
    borderColor: colors.surface,
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
