import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import type { ConstructionZoneProposalPayload, Proposal, RenameProposalPayload } from "@/types";
import { db } from "@/services/firebase";
import { confirmProposal } from "@/services/repositories/firestore/proposalsRepository";
import { useUserStore } from "@/store/useUserStore";
import { CONFIRMATION_THRESHOLD } from "@/constants/proposals";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

export default function ProposalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = useUserStore((state) => state.uid);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, "proposals", id), (snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      const data = snap.data();
      setProposal({
        id: snap.id,
        type: data.type,
        status: data.status,
        submittedBy: data.submittedBy,
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        confirmCount: data.confirmCount ?? 0,
        payload: data.payload,
      });
    });
  }, [id]);

  async function handleConfirm() {
    if (!proposal || !uid) return;
    setConfirming(true);
    try {
      await confirmProposal(proposal.id, uid);
    } catch {
      Alert.alert("Couldn't confirm", "Something went wrong — try again.");
    } finally {
      setConfirming(false);
    }
  }

  if (notFound) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.notFoundTitle}>Proposal not found</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonLabel}>Go back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (!proposal) {
    return <View style={styles.container} />;
  }

  const isSubmitter = uid != null && uid === proposal.submittedBy;
  const isRename = proposal.type === "rename";
  const renamePayload = isRename ? (proposal.payload as RenameProposalPayload) : null;
  const zonePayload = !isRename ? (proposal.payload as ConstructionZoneProposalPayload) : null;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close proposal details"
          hitSlop={8}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
        </Pressable>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{isRename ? "Suggested rename" : "Reported construction"}</Text>

        {renamePayload && (
          <View style={styles.card}>
            <Text style={styles.smallLabel}>Current name</Text>
            <Text style={styles.currentValue}>{renamePayload.currentOfficialName}</Text>
            <Ionicons name="arrow-down" size={18} color={colors.textSecondary} style={styles.arrow} />
            <Text style={styles.smallLabel}>Proposed name</Text>
            <Text style={styles.proposedValue}>
              {renamePayload.proposedOfficialName ?? renamePayload.currentOfficialName}
            </Text>
          </View>
        )}

        {zonePayload && (
          <View style={styles.card}>
            <Text style={styles.proposedValue}>{zonePayload.title}</Text>
            <Text style={styles.description}>{zonePayload.description}</Text>
            <Text style={styles.metaText}>Severity: {zonePayload.severity}</Text>
          </View>
        )}

        <Text style={styles.progressText}>
          {proposal.confirmCount}/{CONFIRMATION_THRESHOLD} confirmations
        </Text>

        {isSubmitter ? (
          <Text style={styles.helperText}>
            You submitted this proposal — other users need to confirm it before it takes effect.
          </Text>
        ) : (
          <Pressable
            onPress={handleConfirm}
            disabled={confirming}
            accessibilityRole="button"
            accessibilityLabel="Confirm this proposal"
            style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.textInverse} />
            <Text style={styles.confirmLabel}>{confirming ? "Confirming…" : "Confirm this edit"}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  smallLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  currentValue: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: 2,
  },
  arrow: {
    marginVertical: spacing.sm,
  },
  proposedValue: {
    ...typography.h3,
    color: colors.accent,
    marginTop: 2,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  progressText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  confirmButton: {
    marginTop: spacing.lg,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  notFoundTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
