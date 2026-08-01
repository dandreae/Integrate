import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Place } from "@/types";
import { RoutingProviderError, type ProviderRouteCandidate, type RoutingProvider, type WalkingRouteQuery } from "@/services/routing/RoutingProvider";
import { clearRouteCache } from "@/services/routing/routeCache";
import { RealRouteRepository } from "../RealRouteRepository";

const ORIGIN = { latitude: 38.9076, longitude: -77.0723 };
const DESTINATION = { latitude: 38.9066, longitude: -77.0745 };

function candidate(overrides: Partial<ProviderRouteCandidate> = {}): ProviderRouteCandidate {
  return {
    coordinates: [ORIGIN, DESTINATION],
    distanceMeters: 250,
    durationSeconds: 200,
    hasDetectedSteps: false,
    ...overrides,
  };
}

class StubProvider implements RoutingProvider {
  readonly name = "stub";
  readonly isReal = true;
  calls: WalkingRouteQuery[] = [];
  constructor(private readonly handler: (query: WalkingRouteQuery) => ProviderRouteCandidate[]) {}
  async getWalkingRoute(query: WalkingRouteQuery): Promise<ProviderRouteCandidate[]> {
    this.calls.push(query);
    return this.handler(query);
  }
}

class FailingProvider implements RoutingProvider {
  readonly name = "failing";
  readonly isReal = true;
  async getWalkingRoute(): Promise<ProviderRouteCandidate[]> {
    throw new RoutingProviderError("boom", "network");
  }
}

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: "dest-place",
    campusId: "campus",
    officialName: "Destination Hall",
    category: "academic",
    description: "",
    latitude: DESTINATION.latitude,
    longitude: DESTINATION.longitude,
    accessibilityFeatures: [],
    entrances: [],
    studentTips: [],
    openingHours: { summary: "" },
    isSaved: false,
    ...overrides,
  };
}

beforeEach(() => {
  clearRouteCache();
});

describe("RealRouteRepository", () => {
  it("ranks candidates differently per preference: fastest picks the quick one, mostAccessible avoids stairs", async () => {
    const provider = new StubProvider((query) =>
      query.preferAccessible
        ? [candidate({ durationSeconds: 400, hasDetectedSteps: false })]
        : [candidate({ durationSeconds: 200, hasDetectedSteps: true })]
    );
    const repo = new RealRouteRepository(provider, new FailingProvider());

    const options = await repo.getRouteOptions({ origin: ORIGIN, destination: DESTINATION });
    const fastest = options.find((o) => o.preference === "fastest")!;
    const mostAccessible = options.find((o) => o.preference === "mostAccessible")!;

    expect(fastest.route?.durationMinutes).toBeLessThan(mostAccessible.route!.durationMinutes);
    expect(fastest.route?.warnings.some((w) => w.type === "stairs")).toBe(true);
    expect(mostAccessible.route?.warnings.some((w) => w.type === "stairs")).toBe(false);
    expect(mostAccessible.reasons).toContain("Avoids stairs");
  });

  it("accessible preference only considers accessible entrances when one exists", async () => {
    const accessibleEntrance = {
      id: "e-accessible",
      placeId: "dest-place",
      latitude: DESTINATION.latitude,
      longitude: DESTINATION.longitude,
      label: "Ramp entrance",
      isAccessible: true,
    };
    const inaccessibleEntrance = {
      id: "e-stairs",
      placeId: "dest-place",
      latitude: DESTINATION.latitude + 0.0002,
      longitude: DESTINATION.longitude,
      label: "Main steps",
      isAccessible: false,
    };
    const destinationPlace = place({ entrances: [inaccessibleEntrance, accessibleEntrance] });

    const provider = new StubProvider((query) => [
      candidate({
        // Slightly different geometry per target point so we can tell which entrance was used.
        coordinates: [ORIGIN, query.destination],
      }),
    ]);
    const repo = new RealRouteRepository(provider, new FailingProvider());

    const options = await repo.getRouteOptions({
      origin: ORIGIN,
      destination: DESTINATION,
      destinationPlace,
    });
    const accessible = options.find((o) => o.preference === "accessible")!;
    expect(accessible.route?.entranceId).toBe("e-accessible");
    expect(accessible.route?.accessibilityConfidence).not.toBe("none");
  });

  it("falls back to the mock provider (clearly labeled) when the real provider fails", async () => {
    const mock = new StubProvider(() => [candidate({ durationSeconds: 300 })]);
    const repo = new RealRouteRepository(new FailingProvider(), mock);

    const options = await repo.getRouteOptions({ origin: ORIGIN, destination: DESTINATION });
    const fastest = options.find((o) => o.preference === "fastest")!;

    expect(fastest.route?.source).toBe("mock");
    expect(mock.calls.length).toBeGreaterThan(0);
  });

  it("returns an explicit unavailable result (never a straight line) when every source fails", async () => {
    const repo = new RealRouteRepository(new FailingProvider(), new FailingProvider());
    const options = await repo.getRouteOptions({ origin: ORIGIN, destination: DESTINATION });

    for (const option of options) {
      expect(option.route).toBeNull();
      expect(option.unavailableReason).toMatch(/unavailable/i);
    }
  });

  it("refuses to route (even via mock) when origin/destination are absurdly far apart", async () => {
    const provider = new StubProvider(() => [candidate()]);
    const mock = new StubProvider(() => [candidate()]);
    const repo = new RealRouteRepository(provider, mock);

    // Cupertino, CA -> Georgetown, DC: ~3,800km, far past any campus-walk scale.
    const options = await repo.getRouteOptions({
      origin: { latitude: 37.3346, longitude: -122.009 },
      destination: DESTINATION,
    });

    for (const option of options) {
      expect(option.route).toBeNull();
      expect(option.unavailableReason).toMatch(/location seems far/i);
    }
    expect(provider.calls.length).toBe(0);
    expect(mock.calls.length).toBe(0);
  });

  it("caches route options for an identical request", async () => {
    const provider = new StubProvider(() => [candidate()]);
    const repo = new RealRouteRepository(provider, new FailingProvider());

    await repo.getRouteOptions({ origin: ORIGIN, destination: DESTINATION });
    const callsAfterFirst = provider.calls.length;
    await repo.getRouteOptions({ origin: ORIGIN, destination: DESTINATION });

    expect(provider.calls.length).toBe(callsAfterFirst);
  });
});
