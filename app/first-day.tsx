import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type MapView from "react-native-maps";
import { router } from "expo-router";
import type { Campus, Place } from "@/types";
import { CampusMapView } from "@/features/map/CampusMapView";
import { TourStopSheet } from "@/features/tour/TourStopSheet";
import { colors, radii, shadow, spacing, typography } from "@/constants/theme";
import { TOUR_STOPS } from "@/data";
import { campusRepository, placeRepository } from "@/services/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useExploredStore } from "@/store/useExploredStore";

type TourPhase = "welcome" | "touring" | "done";

const STOP_REGION_DELTA = 0.0025;

export default function FirstDayScreen() {
  const mapRef = useRef<MapView>(null);
  const selectedCampusId = useAppStore((state) => state.selectedCampusId);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const markExplored = useExploredStore((state) => state.markExplored);

  const [campus, setCampus] = useState<Campus | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [phase, setPhase] = useState<TourPhase>("welcome");
  const [stopIndex, setStopIndex] = useState(0);

  useEffect(() => {
    campusRepository.getCampusById(selectedCampusId).then((result) => setCampus(result ?? null));
    placeRepository.getPlacesByCampus(selectedCampusId).then(setPlaces);
  }, [selectedCampusId]);

  const tourPlaceIds = useMemo(() => new Set(TOUR_STOPS.map((stop) => stop.placeId)), []);
  const tourPlaces = useMemo(() => places.filter((place) => tourPlaceIds.has(place.id)), [places, tourPlaceIds]);

  const currentStop = TOUR_STOPS[stopIndex];
  const currentPlace = tourPlaces.find((place) => place.id === currentStop?.placeId) ?? null;

  useEffect(() => {
    if (phase !== "touring" || !currentPlace) return;
    markExplored(currentPlace.id);
    mapRef.current?.animateToRegion(
      {
        latitude: currentPlace.latitude,
        longitude: currentPlace.longitude,
        latitudeDelta: STOP_REGION_DELTA,
        longitudeDelta: STOP_REGION_DELTA,
      },
      900
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stopIndex, currentPlace?.id]);

  function handleStartTour() {
    setStopIndex(0);
    setPhase("touring");
  }

  function handleNext() {
    if (stopIndex < TOUR_STOPS.length - 1) {
      setStopIndex((i) => i + 1);
    } else {
      setPhase("done");
    }
  }

  function handleBack() {
    setStopIndex((i) => Math.max(0, i - 1));
  }

  function handleFinish() {
    completeOnboarding();
    router.back();
  }

  if (!campus) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <CampusMapView
        ref={mapRef}
        campus={campus}
        places={phase === "touring" ? tourPlaces : []}
        constructionZones={[]}
        showConstruction={false}
        showAccessibleEntrances={false}
        selectedPlaceId={currentPlace?.id ?? null}
        onSelectPlace={() => {}}
        onSelectConstructionZone={() => {}}
        onMapPress={() => {}}
      />

      {phase === "welcome" && (
        <View style={styles.welcomeOverlay} pointerEvents="box-none">
          <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.welcomeCard}>
            <Text style={styles.welcomeEmoji}>📍</Text>
            <Text style={styles.welcomeTitle}>Welcome to {campus.name}</Text>
            <Text style={styles.welcomeBody}>
              Let's show you around — {TOUR_STOPS.length} spots every new student should know before
              week one starts.
            </Text>
            <Pressable
              onPress={handleStartTour}
              accessibilityRole="button"
              accessibilityLabel="Start the tour"
              style={({ pressed }) => [styles.startButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.startButtonLabel}>Start the tour</Text>
            </Pressable>
            <Pressable
              onPress={handleFinish}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
              hitSlop={8}
            >
              <Text style={styles.skipLabel}>Skip for now</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {phase === "touring" && currentStop && currentPlace && (
        <TourStopSheet
          stop={currentStop}
          place={currentPlace}
          index={stopIndex}
          total={TOUR_STOPS.length}
          onNext={handleNext}
          onBack={stopIndex > 0 ? handleBack : undefined}
          onSkip={handleFinish}
        />
      )}

      {phase === "done" && (
        <View style={styles.welcomeOverlay} pointerEvents="box-none">
          <Animated.View entering={FadeIn.duration(300)} style={styles.welcomeCard}>
            <Text style={styles.welcomeEmoji}>🎉</Text>
            <Text style={styles.welcomeTitle}>You're all set!</Text>
            <Text style={styles.welcomeBody}>
              You've seen {TOUR_STOPS.length} campus essentials. Everything else — coffee, quiet study
              spots, accessible routes — is one search away.
            </Text>
            <Pressable
              onPress={handleFinish}
              accessibilityRole="button"
              accessibilityLabel="Start exploring"
              style={({ pressed }) => [styles.startButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.startButtonLabel}>Start exploring</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      <SafeAreaView edges={["top"]} style={styles.closeWrapper} pointerEvents="box-none">
        <Pressable
          onPress={handleFinish}
          accessibilityRole="button"
          accessibilityLabel="Close first day tour"
          hitSlop={8}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonLabel}>Close</Text>
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
  closeWrapper: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  closeButton: {
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  closeButtonLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  welcomeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  welcomeCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadow.floating,
  },
  welcomeEmoji: {
    fontSize: 40,
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: "center",
  },
  welcomeBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  startButton: {
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  startButtonLabel: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  skipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
});
