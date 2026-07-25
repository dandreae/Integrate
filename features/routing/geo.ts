import type { LatLng } from "@/types";

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function pathDistanceMeters(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineDistanceMeters(path[i - 1], path[i]);
  }
  return total;
}

const METERS_PER_MILE = 1609.34;
const METERS_PER_FOOT = 0.3048;

/**
 * Formats a distance for a US campus audience: feet under ~0.1 mi, miles above.
 */
export function formatDistanceMeters(meters: number): string {
  const miles = meters / METERS_PER_MILE;
  if (miles < 0.1) {
    const feet = Math.round(meters / METERS_PER_FOOT / 10) * 10;
    return `${feet} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

export function formatDurationMinutes(minutes: number): string {
  return minutes === 1 ? "1 min" : `${minutes} min`;
}

/** Compass bearing in degrees [0, 360) from `a` to `b`. */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const dLng = toRadians(b.longitude - a.longitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Coarse turn direction between two consecutive bearings — used to phrase
 * simulated step-by-step instructions ("bear left/right") from route
 * geometry alone, since the mock engine has no real street/hallway graph.
 */
export function relativeTurn(fromBearing: number, toBearing: number): "left" | "right" | "straight" {
  let diff = toBearing - fromBearing;
  diff = ((diff + 180) % 360) - 180;
  if (Math.abs(diff) < 15) return "straight";
  return diff > 0 ? "right" : "left";
}

export function midpoint(a: LatLng, b: LatLng): LatLng {
  return {
    latitude: (a.latitude + b.latitude) / 2,
    longitude: (a.longitude + b.longitude) / 2,
  };
}

/**
 * Offsets a point perpendicular to the a->b direction, roughly `meters` away.
 * Used to bend a straight mock segment into something that reads as a walking
 * path rather than a drawn line, and to simulate accessible-route detours.
 */
export function perpendicularOffset(
  a: LatLng,
  b: LatLng,
  meters: number
): LatLng {
  const mid = midpoint(a, b);
  const dLat = b.latitude - a.latitude;
  const dLng = b.longitude - a.longitude;
  const length = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

  // Perpendicular direction in lat/lng space.
  const normLat = -dLng / length;
  const normLng = dLat / length;

  // Rough conversion from meters to degrees latitude.
  const metersToDegrees = meters / 111320;

  return {
    latitude: mid.latitude + normLat * metersToDegrees,
    longitude: mid.longitude + normLng * metersToDegrees,
  };
}

/**
 * Approximate shortest distance from a point to a line segment, in meters.
 * Good enough at campus scale for deciding whether a construction zone sits
 * on a candidate route.
 */
export function distanceToSegmentMeters(
  point: LatLng,
  segmentStart: LatLng,
  segmentEnd: LatLng
): number {
  const A = point.latitude - segmentStart.latitude;
  const B = point.longitude - segmentStart.longitude;
  const C = segmentEnd.latitude - segmentStart.latitude;
  const D = segmentEnd.longitude - segmentStart.longitude;

  const lengthSquared = C * C + D * D;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (A * C + B * D) / lengthSquared));

  const closest: LatLng = {
    latitude: segmentStart.latitude + t * C,
    longitude: segmentStart.longitude + t * D,
  };

  return haversineDistanceMeters(point, closest);
}

/**
 * Shortest distance from a point to an entire multi-segment path, in
 * meters — the "distance from a route" building block used to decide
 * whether a report is geographically relevant to a computed route.
 */
export function distanceToPathMeters(point: LatLng, path: LatLng[]): number {
  if (path.length === 0) return Infinity;
  if (path.length === 1) return haversineDistanceMeters(point, path[0]);

  let closest = Infinity;
  for (let i = 1; i < path.length; i++) {
    const distance = distanceToSegmentMeters(point, path[i - 1], path[i]);
    if (distance < closest) closest = distance;
  }
  return closest;
}
