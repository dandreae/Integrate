import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { Entrance } from "@/types";
import { ACCESSIBLE_ENTRANCE_META } from "@/constants/categories";
import { colors, shadow } from "@/constants/theme";

interface AccessibleEntranceMarkerProps {
  entrance: Entrance;
  placeName: string;
}

function AccessibleEntranceMarkerComponent({ entrance, placeName }: AccessibleEntranceMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: entrance.latitude, longitude: entrance.longitude }}
      tracksViewChanges={false}
      accessibilityLabel={`Accessible entrance: ${entrance.label}, ${placeName}`}
      zIndex={0}
    >
      <View style={styles.pin}>
        <Ionicons name={ACCESSIBLE_ENTRANCE_META.icon} size={12} color={colors.textInverse} />
      </View>
    </Marker>
  );
}

export const AccessibleEntranceMarker = memo(AccessibleEntranceMarkerComponent);

const styles = StyleSheet.create({
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCESSIBLE_ENTRANCE_META.color,
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.card,
  },
});
