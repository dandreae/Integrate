import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { CampusEvent, LatLng } from "@/types";
import { EVENT_CATEGORY_META } from "@/constants/categories";
import { colors, radii, shadow, typography } from "@/constants/theme";
import { daysUntilEvent } from "@/features/events/eventDate";

interface EventMarkerProps {
  event: CampusEvent;
  coordinate: LatLng;
  onPress: (event: CampusEvent) => void;
}

function EventMarkerComponent({ event, coordinate, onPress }: EventMarkerProps) {
  const meta = EVENT_CATEGORY_META[event.category];
  const isToday = daysUntilEvent(event.date) === 0;

  // Events don't toggle a label like place pins do, so this only needs to
  // stay true briefly on mount to let react-native-maps snapshot it once.
  const [tracking, setTracking] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => setTracking(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      onPress={() => onPress(event)}
      tracksViewChanges={tracking}
      accessibilityLabel={`Event: ${event.title}, ${meta.label}${isToday ? ", happening today" : ""}`}
      zIndex={5}
    >
      <View style={styles.badge}>
        <View style={[styles.iconSquare, { backgroundColor: meta.color }]}>
          <Ionicons name={meta.icon} size={14} color={colors.textInverse} />
        </View>
        {isToday && (
          <View style={styles.todayDot}>
            <Text style={styles.todayDotText}>•</Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

export const EventMarker = memo(EventMarkerComponent);

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconSquare: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.card,
  },
  todayDot: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  todayDotText: {
    ...typography.label,
    fontSize: 10,
    lineHeight: 10,
    color: colors.textInverse,
  },
});
