import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";

interface DemoBannerProps {
  message: string | null;
  onExit: () => void;
}

/** Narration banner + escape hatch for Demo Mode — never shown outside of it. */
export function DemoBanner({ message, onExit }: DemoBannerProps) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel="Exit demo mode"
        style={({ pressed }) => [styles.exitPill, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={14} color={colors.textInverse} />
        <Text style={styles.exitLabel}>Exit demo</Text>
      </Pressable>

      {message && (
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={styles.messageCard}>
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: spacing.xxl + spacing.lg,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  exitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.textPrimary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignSelf: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  exitLabel: {
    ...typography.label,
    color: colors.textInverse,
  },
  messageCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: "92%",
    ...shadow.floating,
  },
  messageText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    textAlign: "center",
  },
});
