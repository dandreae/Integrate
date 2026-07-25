import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Place, TourStop } from "@/types";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

interface TourStopSheetProps {
  stop: TourStop;
  place: Place;
  index: number;
  total: number;
  onNext: () => void;
  onBack?: () => void;
  onSkip: () => void;
}

export function TourStopSheet({ stop, place, index, total, onNext, onBack, onSkip }: TourStopSheetProps) {
  const isLast = index === total - 1;

  return (
    <Animated.View style={styles.wrapper} entering={SlideInDown.springify().damping(20)}>
      <SafeAreaView edges={["bottom"]} style={styles.card}>
        <View style={styles.progressRow}>
          {Array.from({ length: total }).map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[styles.dot, dotIndex === index && styles.dotActive, dotIndex < index && styles.dotVisited]}
            />
          ))}
        </View>

        {/* Keying on stop.id remounts this subtree per stop, retriggering
            the fade entrance — a simple, reliable way to transition content
            between tour stops without hand-rolled crossfade logic. */}
        <Animated.View key={stop.id} entering={FadeIn.duration(280)}>
          <View style={styles.illustration}>
            <Text style={styles.illustrationEmoji}>{stop.emoji}</Text>
          </View>

          <Text style={styles.stopCounter}>
            Stop {index + 1} of {total}
          </Text>
          <Text style={styles.officialName}>{place.officialName}</Text>
          {place.localName && <Text style={styles.localName}>Students call it "{place.localName}"</Text>}

          <Text style={styles.headline}>{stop.headline}</Text>
          <Text style={styles.story}>{stop.story}</Text>

          <View style={styles.calloutCard}>
            <Text style={styles.calloutLabel}>Why freshmen should care</Text>
            <Text style={styles.calloutText}>{stop.whyItMatters}</Text>
          </View>

          <View style={[styles.calloutCard, styles.tipCard]}>
            <Text style={styles.calloutLabel}>💡 Fun tip</Text>
            <Text style={styles.calloutText}>{stop.funTip}</Text>
          </View>
        </Animated.View>

        <View style={styles.navRow}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Previous stop"
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}

          <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip tour">
            <Text style={styles.skipLabel}>Skip tour</Text>
          </Pressable>

          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Finish tour" : "Next stop"}
            style={({ pressed }) => [styles.nextButton, pressed && styles.nextButtonPressed]}
          >
            <Text style={styles.nextButtonLabel}>{isLast ? "Finish" : "Next"}</Text>
            <Ionicons name={isLast ? "checkmark" : "chevron-forward"} size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    ...shadow.floating,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotVisited: {
    backgroundColor: colors.accentMuted,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 18,
  },
  illustration: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  illustrationEmoji: {
    fontSize: 44,
  },
  stopCounter: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: "center",
    textTransform: "uppercase",
  },
  officialName: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  localName: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  headline: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  story: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  calloutCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipCard: {
    backgroundColor: colors.accentMuted,
  },
  calloutLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  calloutText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  skipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  nextButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  nextButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
