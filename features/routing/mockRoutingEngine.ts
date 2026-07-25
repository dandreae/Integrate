import type {
  ConstructionZone,
  Entrance,
  LatLng,
  Route,
  RouteRequest,
  RouteStep,
  RouteWarning,
} from "@/types";
import {
  bearingDegrees,
  distanceToSegmentMeters,
  formatDistanceMeters,
  haversineDistanceMeters,
  pathDistanceMeters,
  perpendicularOffset,
  relativeTurn,
} from "./geo";

/**
 * MOCK ROUTING ENGINE
 * -------------------
 * This module stands in for real turn-by-turn routing. It does not know
 * about sidewalks, doors, or floor plans — it bends a straight line between
 * two points so different route preferences read as visibly different paths,
 * it nudges around mocked construction zones, and it phrases "steps" from
 * that bent geometry rather than a real street/hallway graph. Every `Route`
 * this produces is marked `isSimulated: true` for exactly this reason: it is
 * demo data, not live GPS navigation.
 *
 * Swap point for real integration: replace `generateMockRoute` below with a
 * call to a routing provider (e.g. a walking-directions API) or a custom
 * campus path graph (nodes = intersections/doors/elevators, edges =
 * sidewalks/hallways tagged with accessibility metadata). The
 * `RouteRepository` interface this feeds is provider-agnostic, so only this
 * file needs to change.
 */

const WALKING_SPEED_MPS = 1.35; // ~3 mph, average adult walking pace
const ACCESSIBLE_SPEED_FACTOR = 0.8; // accounts for ramps, elevator waits
const CONSTRUCTION_BUFFER_METERS = 30;
const STEEP_ROUTE_DISTANCE_THRESHOLD_METERS = 300;

function zoneCentroid(zone: ConstructionZone): LatLng {
  const latitude =
    zone.coordinates.reduce((sum, c) => sum + c.latitude, 0) / zone.coordinates.length;
  const longitude =
    zone.coordinates.reduce((sum, c) => sum + c.longitude, 0) / zone.coordinates.length;
  return { latitude, longitude };
}

function pathNearZone(path: LatLng[], zone: ConstructionZone): boolean {
  return zone.coordinates.some((zonePoint) =>
    path
      .slice(1)
      .some(
        (_, i) =>
          distanceToSegmentMeters(zonePoint, path[i], path[i + 1]) < CONSTRUCTION_BUFFER_METERS
      )
  );
}

function bentPath(origin: LatLng, destination: LatLng, bendMeters: number): LatLng[] {
  const bendPoint = perpendicularOffset(origin, destination, bendMeters);
  return [origin, bendPoint, destination];
}

function accessiblePath(origin: LatLng, destination: LatLng): LatLng[] {
  // Simulates routing via an accessible entrance/ramp rather than the direct
  // path: a wider, two-waypoint detour that reads as a longer, gentler route.
  const first = perpendicularOffset(origin, destination, 22);
  const second = perpendicularOffset(origin, destination, 34);
  return [origin, first, second, destination];
}

function rerouteAroundZones(
  origin: LatLng,
  destination: LatLng,
  basePath: LatLng[],
  zones: ConstructionZone[]
): { path: LatLng[]; rerouted: boolean } {
  const blockingZones = zones.filter((zone) => pathNearZone(basePath, zone));
  if (blockingZones.length === 0) {
    return { path: basePath, rerouted: false };
  }

  // Pick the side (positive or negative offset) farther from the average
  // blocking-zone centroid, then bend harder to swing around it.
  const avgZone = zoneCentroid(blockingZones[0]);
  const positive = perpendicularOffset(origin, destination, 55);
  const negative = perpendicularOffset(origin, destination, -55);
  const detourPoint =
    haversineDistanceMeters(positive, avgZone) > haversineDistanceMeters(negative, avgZone)
      ? positive
      : negative;

  return { path: [origin, detourPoint, destination], rerouted: true };
}

interface ResolvedDestination {
  coordinate: LatLng;
  accessibleEntranceLabel?: string;
  entranceWarning?: RouteWarning;
}

/**
 * For the "accessible" preference, target the nearest accessible entrance
 * instead of the place's raw coordinate — this is what makes "prefer
 * accessible entrances" a real routing decision rather than a label. When no
 * accessible entrance is on record, the route still completes (ending at the
 * place's coordinate) but carries an explicit warning rather than silently
 * pretending the destination is accessible.
 */
function resolveDestination(
  destination: LatLng,
  origin: LatLng,
  preference: RouteRequest["preference"],
  entrances: Entrance[] | undefined
): ResolvedDestination {
  if (preference !== "accessible") {
    return { coordinate: destination };
  }

  const accessibleEntrances = (entrances ?? []).filter((entrance) => entrance.isAccessible);

  if (accessibleEntrances.length === 0) {
    return {
      coordinate: destination,
      entranceWarning: {
        type: "no-accessible-entrance",
        label: "No accessible entrance on record",
        severity: "caution",
        description:
          "This place has no accessible entrance logged yet — this route ends at its main location, which may involve stairs.",
      },
    };
  }

  const nearest = accessibleEntrances.reduce((closest, candidate) => {
    const distance = haversineDistanceMeters(origin, {
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    });
    return distance < closest.distance ? { entrance: candidate, distance } : closest;
  }, { entrance: accessibleEntrances[0], distance: Infinity });

  return {
    coordinate: { latitude: nearest.entrance.latitude, longitude: nearest.entrance.longitude },
    accessibleEntranceLabel: nearest.entrance.label,
  };
}

function buildWarnings(
  preference: RouteRequest["preference"],
  distanceMeters: number,
  path: LatLng[],
  zones: ConstructionZone[],
  rerouted: boolean
): RouteWarning[] {
  const warnings: RouteWarning[] = [];

  if (preference === "accessible") {
    warnings.push({
      type: "elevator-dependent",
      label: "Relies on ramps & elevators",
      severity: "info",
      description:
        "This route uses ramps and elevators instead of stairs. It may take longer if an elevator is temporarily out of service.",
    });
  }

  if (preference === "fastest") {
    warnings.push({
      type: "stairs",
      label: "May include stairs",
      severity: "caution",
      description:
        "This is the most direct path and may pass through entrances with stairs and no ramp.",
    });
    if (distanceMeters > STEEP_ROUTE_DISTANCE_THRESHOLD_METERS) {
      warnings.push({
        type: "steep-incline",
        label: "Steep incline",
        severity: "caution",
        description: "Part of this route crosses one of campus's steeper walkways.",
      });
    }
  }

  if (preference === "avoidConstruction") {
    if (rerouted) {
      warnings.push({
        type: "construction",
        label: "Rerouted around construction",
        severity: "info",
        description: "This route was adjusted to avoid an active construction zone.",
      });
    }
  } else {
    // Even outside the "avoid construction" preference, surface nearby work
    // zones so users understand why a route might look indirect or busy.
    const nearby = zones.find((zone) => pathNearZone(path, zone));
    if (nearby) {
      warnings.push({
        type: "construction",
        label: `Construction near route: ${nearby.title}`,
        severity: nearby.severity === "high" ? "high" : "caution",
        description: nearby.description,
      });
    }
  }

  return warnings;
}

/**
 * Turns bent mock-path geometry into short, plain-language "steps". These
 * are simulated from waypoint turns, not derived from any real sidewalk or
 * hallway graph — intentionally kept brief (a handful of legs at most) so
 * they read as an approximation rather than authoritative turn-by-turn.
 */
function buildSteps(
  path: LatLng[],
  originLabel: string,
  destinationLabel: string,
  accessibleEntranceLabel?: string
): RouteStep[] {
  const steps: RouteStep[] = [];
  const finalLabel = accessibleEntranceLabel
    ? `${destinationLabel} (via ${accessibleEntranceLabel})`
    : destinationLabel;

  steps.push({
    id: "depart",
    instruction: `Head out from ${originLabel}.`,
    distanceMeters: 0,
  });

  for (let i = 1; i < path.length; i++) {
    const legDistanceMeters = haversineDistanceMeters(path[i - 1], path[i]);
    const isLast = i === path.length - 1;

    if (isLast) {
      steps.push({
        id: "arrive",
        instruction: `Arrive at ${finalLabel}.`,
        distanceMeters: Math.round(legDistanceMeters),
      });
      continue;
    }

    let phrase = "Continue straight";
    if (i >= 2) {
      const previousBearing = bearingDegrees(path[i - 2], path[i - 1]);
      const nextBearing = bearingDegrees(path[i - 1], path[i]);
      const turn = relativeTurn(previousBearing, nextBearing);
      phrase = turn === "straight" ? "Continue straight" : `Bear ${turn}`;
    }

    steps.push({
      id: `leg-${i}`,
      instruction: `${phrase} for ${formatDistanceMeters(legDistanceMeters)}.`,
      distanceMeters: Math.round(legDistanceMeters),
    });
  }

  return steps;
}

export function generateMockRoute(
  request: RouteRequest,
  constructionZones: ConstructionZone[]
): Route {
  const { origin, destination, preference, destinationEntrances } = request;

  const resolved = resolveDestination(
    destination.coordinate,
    origin.coordinate,
    preference,
    destinationEntrances
  );

  let path: LatLng[];
  let rerouted = false;

  if (preference === "accessible") {
    path = accessiblePath(origin.coordinate, resolved.coordinate);
  } else if (preference === "avoidConstruction") {
    const base = bentPath(origin.coordinate, resolved.coordinate, 8);
    const result = rerouteAroundZones(origin.coordinate, resolved.coordinate, base, constructionZones);
    path = result.path;
    rerouted = result.rerouted;
  } else {
    path = bentPath(origin.coordinate, resolved.coordinate, 8);
  }

  const distanceMeters = pathDistanceMeters(path);
  const speed = preference === "accessible" ? WALKING_SPEED_MPS * ACCESSIBLE_SPEED_FACTOR : WALKING_SPEED_MPS;
  const durationMinutes = Math.max(1, Math.round(distanceMeters / speed / 60));

  const warnings = buildWarnings(preference, distanceMeters, path, constructionZones, rerouted);
  if (resolved.entranceWarning) {
    warnings.unshift(resolved.entranceWarning);
  }

  const steps = buildSteps(path, origin.label, destination.label, resolved.accessibleEntranceLabel);

  return {
    id: `route-${preference}-${origin.coordinate.latitude.toFixed(4)}-${resolved.coordinate.latitude.toFixed(4)}-${Date.now()}`,
    coordinates: path,
    distanceMeters: Math.round(distanceMeters),
    durationMinutes,
    preference,
    warnings,
    steps,
    originLabel: origin.label,
    destinationLabel: destination.label,
    accessibleEntranceLabel: resolved.accessibleEntranceLabel,
    isSimulated: true,
  };
}
