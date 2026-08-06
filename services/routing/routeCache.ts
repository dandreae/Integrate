import type { AccessibilityReport, ConstructionZone, LatLng, RouteOption } from "@/types";

/** Lightweight in-memory session cache. No persistence, no TTL. */
const cache = new Map<string, RouteOption[]>();

function roundCoord(value: number): number {
  // ~1m precision — enough to dedupe repeat requests without merging distinct entrances.
  return Math.round(value * 1e5) / 1e5;
}

export function buildRouteCacheKey(
  origin: LatLng,
  destination: LatLng,
  constructionZones: ConstructionZone[],
  accessibilityReports: AccessibilityReport[] = []
): string {
  const zoneFingerprint = constructionZones
    .map((z) => `${z.id}:${z.status ?? "reported"}`)
    .sort()
    .join(",");
  const reportFingerprint = accessibilityReports
    .map((r) => `${r.id}:${r.status}:${r.confirmCount}`)
    .sort()
    .join(",");
  return [
    roundCoord(origin.latitude),
    roundCoord(origin.longitude),
    roundCoord(destination.latitude),
    roundCoord(destination.longitude),
    zoneFingerprint,
    reportFingerprint,
  ].join("|");
}

export function getCachedRouteOptions(key: string): RouteOption[] | undefined {
  return cache.get(key);
}

export function setCachedRouteOptions(key: string, value: RouteOption[]): void {
  cache.set(key, value);
}

/** Test-only helper. */
export function clearRouteCache(): void {
  cache.clear();
}
