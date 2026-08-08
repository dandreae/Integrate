import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import type { MockCampusUser } from "@/types";
import { colors, radii, shadow, typography } from "@/constants/theme";

interface UserMarkerProps {
  user: MockCampusUser;
  onPress: (user: MockCampusUser) => void;
}

function UserMarkerComponent({ user, onPress }: UserMarkerProps) {
  // Same one-shot tracking trick as EventMarker — lets react-native-maps
  // snapshot the custom view once on mount instead of re-rendering it live.
  const [tracking, setTracking] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => setTracking(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Marker
      coordinate={user.currentLocation}
      onPress={() => onPress(user)}
      tracksViewChanges={tracking}
      accessibilityLabel={`${user.name} is nearby`}
      zIndex={4}
    >
      <View style={styles.root}>
        {/* Soft halo behind the avatar — place pins are solid circles with a
            stem, so this ring is what reads as "a person" at a glance
            instead of another building/category pin. Sibling of the avatar,
            not a parent, so its lower opacity doesn't dim the avatar too. */}
        <View style={[styles.halo, { backgroundColor: user.avatarColor }]} />
        <View style={[styles.avatar, { backgroundColor: user.avatarColor }]}>
          <Text style={styles.initials}>{user.avatarInitials}</Text>
        </View>
      </View>
    </Marker>
  );
}

export const UserMarker = memo(UserMarkerComponent);

const styles = StyleSheet.create({
  root: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.pill,
    opacity: 0.25,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.card,
  },
  initials: {
    ...typography.label,
    fontSize: 9,
    lineHeight: 11,
    color: colors.textInverse,
  },
});
