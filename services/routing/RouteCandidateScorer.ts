import type {
  AccessibilityConfidence,
  ConstructionZone,
  RoutePreference,
  RouteWarning,
} from "@/types";
import { ROUTING_CONFIG } from "@/constants/routing";
import { distanceToSegmentMeters } from "@/features/routing/geo";
import type { ProviderRouteCandidate } from "./RoutingProvider";
import type { EntranceCandidate } from "./entranceSelection";

export interface ScoreInput {
  candidate: ProviderRouteCandidate;
  entranceCandidate: EntranceCandidate;
  preference: RoutePreference;
  constructionZones: ConstructionZone[];
}

export interface ScoreResult {
  score: number;
  rejected: boolean;
  rejectionReason?: string;
  warnings: RouteWarning[];
  accessibilityConfidence: AccessibilityConfidence;
  usedAccessibleEntrance: boolean;
  verifiedAccessibleEntrance: boolean;
  hasStairs: boolean;
  nearbyConstructionZones: ConstructionZone[];
}

function pathNearZone(
  path: { latitude: number; longitude: number }[],
  zone: ConstructionZone,
  bufferMeters: number
): boolean {
  if (path.length < 2) return false;
  return zone.coordinates.some((zonePoint) =>
    path
      .slice(1)
      .some((_, i) => distanceToSegmentMeters(zonePoint, path[i], path[i + 1]) < bufferMeters)
  );
}

function isVerifiedRecently(verifiedAt: string | undefined, recencyDays: number): boolean {
  if (!verifiedAt) return false;
  const verifiedDate = new Date(verifiedAt).getTime();
  if (Number.isNaN(verifiedDate)) return false;
  const ageDays = (Date.now() - verifiedDate) / (1000 * 60 * 60 * 24);
  return ageDays >= 0 && ageDays <= recencyDays;
}

export function scoreCandidate({
  candidate,
  entranceCandidate,
  preference,
  constructionZones,
}: ScoreInput): ScoreResult {
  const s = ROUTING_CONFIG.scoring;
  const warnings: RouteWarning[] = [];

  const nearbyConstructionZones = constructionZones.filter((zone) =>
    pathNearZone(candidate.coordinates, zone, s.constructionBufferMeters)
  );

  const confirmedClosure = nearbyConstructionZones.find((zone) => zone.status === "confirmed-closure");
  if (confirmedClosure) {
    return {
      score: Number.POSITIVE_INFINITY,
      rejected: true,
      rejectionReason: `Route passes through a confirmed closure: ${confirmedClosure.title}.`,
      warnings: [
        {
          type: "construction",
          label: `Closed: ${confirmedClosure.title}`,
          severity: "high",
          description: confirmedClosure.description,
        },
      ],
      accessibilityConfidence: "none",
      usedAccessibleEntrance: false,
      verifiedAccessibleEntrance: false,
      hasStairs: candidate.hasDetectedSteps,
      nearbyConstructionZones,
    };
  }

  let score = candidate.durationSeconds * s.durationWeight[preference];

  // Stairs
  if (candidate.hasDetectedSteps) {
    score += s.stairPenaltySeconds[preference];
    warnings.push({
      type: "stairs",
      label: "May include stairs",
      severity: preference === "fastest" ? "caution" : "high",
      description: "This route's walking directions include steps or stairs.",
    });
  }

  // Entrance accessibility
  const entrance = entranceCandidate.entrance;
  const usedAccessibleEntrance = Boolean(entrance?.isAccessible);
  const verifiedAccessibleEntrance =
    usedAccessibleEntrance && isVerifiedRecently(entrance?.accessibilityVerifiedAt, s.verifiedRecencyDays);

  if (entranceCandidate.isKnownEntrance && entrance && !entrance.isAccessible) {
    score += s.inaccessibleEntrancePenaltySeconds[preference];
    if (preference !== "fastest") {
      warnings.push({
        type: "entrance-closed",
        label: "No verified accessible entrance",
        severity: "caution",
        description: `${entrance.label} is not known to be accessible.`,
      });
    }
  }

  if (usedAccessibleEntrance) {
    score -= s.accessibleEntranceBonusSeconds[preference];
    if (verifiedAccessibleEntrance) {
      score -= s.verifiedAccessibilityBonusSeconds[preference];
    }
  }

  // Accessibility confidence + uncertainty penalty
  let accessibilityConfidence: AccessibilityConfidence;
  if (!entranceCandidate.isKnownEntrance) {
    accessibilityConfidence = "none";
    score += s.accessibilityUncertaintyPenaltySeconds[preference];
    if (preference !== "fastest") {
      warnings.push({
        type: "accessibility-unverified",
        label: "Accessible entrance could not be verified",
        severity: "caution",
        description: "No entrance data exists for this destination, so accessibility can't be confirmed.",
      });
    }
  } else if (verifiedAccessibleEntrance) {
    accessibilityConfidence = "verified";
  } else {
    accessibilityConfidence = "unverified";
  }

  // Construction (non-closure)
  for (const zone of nearbyConstructionZones) {
    const multiplier = zone.affectedAccessibility
      ? s.constructionAccessibilityImpactMultiplier[preference]
      : 1;
    score += s.constructionPenaltySeconds[preference] * multiplier;
    warnings.push({
      type: "construction",
      label: `Construction near route: ${zone.title}`,
      severity: zone.severity === "high" ? "high" : "caution",
      description: zone.description,
    });
  }

  return {
    score,
    rejected: false,
    warnings,
    accessibilityConfidence,
    usedAccessibleEntrance,
    verifiedAccessibleEntrance,
    hasStairs: candidate.hasDetectedSteps,
    nearbyConstructionZones,
  };
}
