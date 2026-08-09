import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Campus, CampusEvent, Place } from "@/types";
import type { GeocodingProvider } from "@/services/geocoding";
import { EventProviderError, type EventProvider } from "@/services/events/EventProvider";
import type { CampusRepository } from "../CampusRepository";
import type { EventRepository } from "../EventRepository";
import type { PlaceRepository } from "../PlaceRepository";

const cacheMocks = vi.hoisted(() => ({
  readEventsCacheMeta: vi.fn(),
  readCachedEvents: vi.fn(),
  writeEventsCache: vi.fn(),
}));

vi.mock("../firestore/eventsCache", () => cacheMocks);

const { RealEventRepository } = await import("../RealEventRepository");

const CAMPUS_ID = "georgetown-university";
const CAMPUS: Campus = {
  id: CAMPUS_ID,
  name: "Georgetown University",
  latitude: 38.9076,
  longitude: -77.0723,
  mapRegion: { latitude: 38.9076, longitude: -77.0723, latitudeDelta: 0.01, longitudeDelta: 0.01 },
};

function event(overrides: Partial<CampusEvent> = {}): CampusEvent {
  return {
    id: "e1",
    campusId: CAMPUS_ID,
    title: "Test Event",
    startAt: "2026-08-11T12:00:00.000Z",
    date: "2026-08-11",
    category: "other",
    expectedPopularity: "medium",
    source: "georgetown-livewhale",
    ...overrides,
  };
}

const stubGeocoder: GeocodingProvider = {
  name: "stub",
  async search() {
    return [];
  },
  async reverse() {
    return null;
  },
};

const stubPlaces: PlaceRepository = {
  async getPlacesByCampus() {
    return [] as Place[];
  },
  async getPlaceById() {
    return undefined;
  },
  async searchPlaces() {
    return [];
  },
  async getPlacesByCategory() {
    return [];
  },
};

const stubCampuses: CampusRepository = {
  async getCampuses() {
    return [CAMPUS];
  },
  async getCampusById() {
    return CAMPUS;
  },
  async getConstructionZones() {
    return [];
  },
  async getMockUsers() {
    return [];
  },
};

function stubProvider(handler: () => Promise<CampusEvent[]>): EventProvider {
  return { name: "stub-provider", isReal: true, getEvents: handler };
}

function stubFallback(events: CampusEvent[]): EventRepository {
  return { getEvents: async () => events };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RealEventRepository", () => {
  it("returns fresh cached events without calling the live provider", async () => {
    cacheMocks.readEventsCacheMeta.mockResolvedValue({ fetchedAt: Date.now(), source: "stub-provider" });
    cacheMocks.readCachedEvents.mockResolvedValue([event({ id: "cached" })]);
    const provider = stubProvider(vi.fn());
    const repo = new RealEventRepository(provider, stubPlaces, stubCampuses, stubGeocoder, stubFallback([]));

    const events = await repo.getEvents(CAMPUS_ID);

    expect(events.map((e) => e.id)).toEqual(["cached"]);
    expect(cacheMocks.writeEventsCache).not.toHaveBeenCalled();
  });

  it("fetches live and writes back the cache when there's no fresh cache", async () => {
    cacheMocks.readEventsCacheMeta.mockResolvedValue(null);
    const getEvents = vi.fn().mockResolvedValue([event({ id: "live" })]);
    const provider = stubProvider(getEvents);
    const repo = new RealEventRepository(provider, stubPlaces, stubCampuses, stubGeocoder, stubFallback([]));

    const events = await repo.getEvents(CAMPUS_ID);

    expect(getEvents).toHaveBeenCalledWith(CAMPUS_ID);
    expect(events.map((e) => e.id)).toEqual(["live"]);
    expect(cacheMocks.writeEventsCache).toHaveBeenCalled();
  });

  it("falls back to a stale cache when the live provider fails", async () => {
    cacheMocks.readEventsCacheMeta.mockResolvedValue(null);
    cacheMocks.readCachedEvents.mockResolvedValue([event({ id: "stale" })]);
    const provider = stubProvider(async () => {
      throw new EventProviderError("boom", "network");
    });
    const repo = new RealEventRepository(provider, stubPlaces, stubCampuses, stubGeocoder, stubFallback([]));

    const events = await repo.getEvents(CAMPUS_ID);

    expect(events.map((e) => e.id)).toEqual(["stale"]);
  });

  it("falls back to the seeded repository when live and cache are both unavailable", async () => {
    cacheMocks.readEventsCacheMeta.mockResolvedValue(null);
    cacheMocks.readCachedEvents.mockResolvedValue([]);
    const provider = stubProvider(async () => {
      throw new EventProviderError("boom", "network");
    });
    const repo = new RealEventRepository(
      provider,
      stubPlaces,
      stubCampuses,
      stubGeocoder,
      stubFallback([event({ id: "fallback" })])
    );

    const events = await repo.getEvents(CAMPUS_ID);

    expect(events.map((e) => e.id)).toEqual(["fallback"]);
  });

  it("treats a stale (expired TTL) cache as not fresh and refetches live", async () => {
    cacheMocks.readEventsCacheMeta.mockResolvedValue({ fetchedAt: Date.now() - 1000 * 60 * 60 * 5, source: "x" });
    const getEvents = vi.fn().mockResolvedValue([event({ id: "refetched" })]);
    const provider = stubProvider(getEvents);
    const repo = new RealEventRepository(provider, stubPlaces, stubCampuses, stubGeocoder, stubFallback([]));

    const events = await repo.getEvents(CAMPUS_ID);

    expect(getEvents).toHaveBeenCalled();
    expect(events.map((e) => e.id)).toEqual(["refetched"]);
  });
});
