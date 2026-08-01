import { describe, expect, it } from "vitest";
import { haversineDistanceMeters } from "@/features/routing/geo";
import { DEMO_ROUTE_FIXTURES } from "../demoRouteFixtures";

/**
 * Geographic sanity checks for the captured demo-day fixtures (spec section
 * 14): every one of them must look like a real pedestrian route, not a
 * straight line — since if a fixture regresses to a straight line, the demo
 * safety net silently becomes exactly the bad behavior this whole rework
 * exists to eliminate.
 */
describe("DEMO_ROUTE_FIXTURES geographic sanity", () => {
  it("has at least the expected number of captured demo routes", () => {
    expect(DEMO_ROUTE_FIXTURES.length).toBeGreaterThanOrEqual(4);
  });

  it.each(DEMO_ROUTE_FIXTURES.map((f) => [f.id, f] as const))("%s looks like a real route", (_id, fixture) => {
    const { coordinates } = fixture.candidate;

    // Real pedestrian geometry, not a 2-point straight line.
    expect(coordinates.length).toBeGreaterThan(2);

    // No NaN/invalid coordinates.
    for (const point of coordinates) {
      expect(Number.isFinite(point.latitude)).toBe(true);
      expect(Number.isFinite(point.longitude)).toBe(true);
      expect(Math.abs(point.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(point.longitude)).toBeLessThanOrEqual(180);
    }

    // A real walked path is never shorter than the straight-line distance.
    const straightLineMeters = haversineDistanceMeters(fixture.origin, fixture.destination);
    expect(fixture.candidate.distanceMeters).toBeGreaterThanOrEqual(straightLineMeters - 1); // 1m float slack

    // The route's endpoint should land near the requested destination.
    const endpoint = coordinates[coordinates.length - 1];
    expect(haversineDistanceMeters(endpoint, fixture.destination)).toBeLessThan(120);

    // ...and start near the requested origin.
    const startpoint = coordinates[0];
    expect(haversineDistanceMeters(startpoint, fixture.origin)).toBeLessThan(120);
  });
});
