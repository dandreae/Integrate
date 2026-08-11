import { useState, type ComponentProps } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow, spacing, touchTarget, typography } from "@/constants/theme";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useAppStore } from "@/store/useAppStore";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface StepContent {
  icon: IoniconName;
  title: string;
  body: string;
}

const STEPS: StepContent[] = [
  {
    icon: "compass-outline",
    title: "Welcome to Integrate",
    body: "Georgetown's campus is big, and figuring it out shouldn't slow you down. Integrate helps you find your way around — and helps every student who comes after you too.",
  },
  {
    icon: "walk-outline",
    title: "Real walking directions",
    body: "Routes follow real sidewalks and paths, not straight lines through buildings — and can account for stairs, ramps, elevators, and accessible entrances.",
  },
  {
    icon: "people-outline",
    title: "Built by students, for students",
    body: "Report an accessibility issue and it instantly reroutes other students around it. See campus events, deals, and what people are saying about a spot before you go.",
  },
];

/**
 * Full-screen, forward-only intro shown once (gated by
 * useAppStore.hasCompletedOnboarding, persisted). The last step doubles as
 * real setup — the accessible-routing toggle and location permission here
 * are the same store field / hook used everywhere else in the app, not a
 * separate onboarding-only concept.
 */
export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const prefersAccessibleRouting = useAppStore((state) => state.prefersAccessibleRouting);
  const setPrefersAccessibleRouting = useAppStore((state) => state.setPrefersAccessibleRouting);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const { requestLocation, permissionDenied } = useCurrentLocation();
  const [locationGranted, setLocationGranted] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);

  const isFinalStep = step === STEPS.length;
  const totalSteps = STEPS.length + 1;

  function goNext() {
    setStep((current) => Math.min(current + 1, STEPS.length));
  }

  function skipToEnd() {
    setStep(STEPS.length);
  }

  async function handleEnableLocation() {
    setRequestingLocation(true);
    const result = await requestLocation();
    setRequestingLocation(false);
    setLocationGranted(result !== null);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View key={index} style={[styles.dot, index === step && styles.dotActive]} />
            ))}
          </View>
          {!isFinalStep && (
            <Pressable
              onPress={skipToEnd}
              accessibilityRole="button"
              accessibilityLabel="Skip introduction"
              hitSlop={8}
            >
              <Text style={styles.skipLabel}>Skip</Text>
            </Pressable>
          )}
        </View>

        {isFinalStep ? (
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Ionicons name="rocket-outline" size={40} color={colors.textInverse} />
            </View>
            <Text style={styles.title}>You're set up</Text>
            <Text style={styles.body}>A couple quick things, then you're in.</Text>

            <View style={styles.setupCard}>
              <View style={styles.setupRow}>
                <View style={styles.setupText}>
                  <Text style={styles.setupLabel}>Prioritize accessible routes</Text>
                  <Text style={styles.setupHelper}>
                    Default to routes with verified accessible entrances and step-free paths. You can fine-tune
                    this anytime from the map.
                  </Text>
                </View>
                <Switch
                  value={prefersAccessibleRouting}
                  onValueChange={setPrefersAccessibleRouting}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Prioritize accessible routes by default"
                  accessibilityRole="switch"
                />
              </View>

              <View style={styles.divider} />

              <Pressable
                onPress={handleEnableLocation}
                disabled={requestingLocation || locationGranted}
                accessibilityRole="button"
                accessibilityLabel={locationGranted ? "Location enabled" : "Enable location"}
                style={styles.locationRow}
              >
                <View style={[styles.locationIconWrap, locationGranted && styles.locationIconWrapGranted]}>
                  <Ionicons
                    name={locationGranted ? "checkmark" : "locate-outline"}
                    size={18}
                    color={locationGranted ? colors.textInverse : colors.accent}
                  />
                </View>
                <View style={styles.setupText}>
                  <Text style={styles.setupLabel}>
                    {locationGranted ? "Location enabled" : "Enable your location"}
                  </Text>
                  <Text style={styles.setupHelper}>
                    {permissionDenied
                      ? "Permission denied — you can turn this on later in Settings."
                      : "See where you are on campus and get walking directions."}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Ionicons name={STEPS[step].icon} size={40} color={colors.textInverse} />
            </View>
            <Text style={styles.title}>{STEPS[step].title}</Text>
            <Text style={styles.body}>{STEPS[step].body}</Text>
          </View>
        )}

        <Pressable
          onPress={isFinalStep ? completeOnboarding : goNext}
          accessibilityRole="button"
          accessibilityLabel={isFinalStep ? "Get started" : "Next"}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonLabel}>{isFinalStep ? "Get started" : "Next"}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    minHeight: touchTarget.minimum,
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 20,
  },
  skipLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    ...shadow.floating,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  setupCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xl,
    ...shadow.card,
  },
  setupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  setupText: {
    flex: 1,
  },
  setupLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  setupHelper: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  locationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  locationIconWrapGranted: {
    backgroundColor: colors.accessible,
  },
  primaryButton: {
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  primaryButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
});
