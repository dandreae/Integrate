import { memo, useEffect } from "react";
import { StyleSheet } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import type { ConstructionZone } from "@/types";
import { CONSTRUCTION_META } from "@/constants/categories";
import { colors, shadow } from "@/constants/theme";

interface ConstructionZoneOverlayProps {
  zone: ConstructionZone;
  onPress: (zone: ConstructionZone) => void;
}

function ConstructionZoneOverlayComponent({ zone, onPress }: ConstructionZoneOverlayProps) {
  const midIndex = Math.floor(zone.coordinates.length / 2);
  const labelCoordinate = zone.coordinates[midIndex];

  // There are only ever a couple of active construction zones, so a
  // continuous marker pulse (which requires `tracksViewChanges`) stays cheap
  // here — this is the same bounded-cost pattern used for landmark markers.
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <>
      <Polyline
        coordinates={zone.coordinates}
        strokeColor={CONSTRUCTION_META.color}
        strokeWidth={4}
        lineDashPattern={[10, 6]}
        zIndex={2}
      />
      <Marker
        coordinate={labelCoordinate}
        onPress={() => onPress(zone)}
        tracksViewChanges
        accessibilityLabel={`Construction: ${zone.title}, ${zone.severity} severity`}
        zIndex={5}
      >
        <Animated.View style={[styles.pin, animatedStyle]}>
          <Ionicons name={CONSTRUCTION_META.icon} size={14} color={colors.textInverse} />
        </Animated.View>
      </Marker>
    </>
  );
}

export const ConstructionZoneOverlay = memo(ConstructionZoneOverlayComponent);

const styles = StyleSheet.create({
  pin: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CONSTRUCTION_META.color,
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.card,
  },
});
