import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
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
        tracksViewChanges={false}
        accessibilityLabel={`Construction: ${zone.title}, ${zone.severity} severity`}
        zIndex={5}
      >
        <View style={styles.pin}>
          <Ionicons name={CONSTRUCTION_META.icon} size={14} color={colors.textInverse} />
        </View>
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
