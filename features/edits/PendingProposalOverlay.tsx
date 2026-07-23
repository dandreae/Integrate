import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import type { ConstructionZoneProposalPayload, Place, Proposal, RenameProposalPayload } from "@/types";
import { CONSTRUCTION_META } from "@/constants/categories";
import { CONFIRMATION_THRESHOLD } from "@/constants/proposals";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

interface PendingProposalOverlayProps {
  proposal: Proposal;
  places: Place[];
  onPress: (proposal: Proposal) => void;
}

function PendingProposalOverlayComponent({ proposal, places, onPress }: PendingProposalOverlayProps) {
  const progressLabel = `${proposal.confirmCount}/${CONFIRMATION_THRESHOLD}`;

  if (proposal.type === "rename") {
    const payload = proposal.payload as RenameProposalPayload;
    const place = places.find((candidate) => candidate.id === payload.placeId);
    if (!place) return null;

    return (
      <Marker
        coordinate={{ latitude: place.latitude, longitude: place.longitude }}
        onPress={() => onPress(proposal)}
        tracksViewChanges={false}
        accessibilityLabel={`Pending rename for ${payload.currentOfficialName} to ${payload.proposedOfficialName}, ${progressLabel} confirmations`}
        zIndex={6}
      >
        <View style={styles.markerStack}>
          <View style={styles.pendingPin}>
            <Ionicons name="text-outline" size={14} color={colors.textInverse} />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{progressLabel}</Text>
          </View>
        </View>
      </Marker>
    );
  }

  const payload = proposal.payload as ConstructionZoneProposalPayload;
  const midIndex = Math.floor(payload.coordinates.length / 2);
  const labelCoordinate = payload.coordinates[midIndex];
  if (!labelCoordinate) return null;

  return (
    <>
      <Polyline
        coordinates={payload.coordinates}
        strokeColor={CONSTRUCTION_META.color}
        strokeWidth={3}
        lineDashPattern={[4, 8]}
        zIndex={2}
      />
      <Marker
        coordinate={labelCoordinate}
        onPress={() => onPress(proposal)}
        tracksViewChanges={false}
        accessibilityLabel={`Reported construction: ${payload.title}, pending, ${progressLabel} confirmations`}
        zIndex={6}
      >
        <View style={styles.markerStack}>
          <View style={[styles.pendingPin, styles.pendingConstructionPin]}>
            <Ionicons name={CONSTRUCTION_META.icon} size={14} color={colors.textInverse} />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{progressLabel}</Text>
          </View>
        </View>
      </Marker>
    </>
  );
}

export const PendingProposalOverlay = memo(PendingProposalOverlayComponent);

const styles = StyleSheet.create({
  markerStack: {
    alignItems: "center",
  },
  pendingPin: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
    borderStyle: "dashed",
    opacity: 0.85,
    ...shadow.card,
  },
  pendingConstructionPin: {
    backgroundColor: CONSTRUCTION_META.color,
  },
  badge: {
    alignSelf: "center",
    marginTop: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  badgeText: {
    ...typography.label,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textPrimary,
  },
});
