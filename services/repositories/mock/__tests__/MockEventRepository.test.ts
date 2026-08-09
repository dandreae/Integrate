import { describe, expect, it } from "vitest";
import type { Campus, Place } from "@/types";
import type { GeocodingProvider } from "@/services/geocoding";
import type { CampusRepository } from "../../CampusRepository";
import type { PlaceRepository } from "../../PlaceRepository";
import { MockEventRepository } from "../MockEventRepository";

const CAMPUS: Campus = {
  id: "georgetown-university",
  name: "Georgetown University",
  latitude: 38.9076,
  longitude: -77.0723,
  mapRegion: { latitude: 38.9076, longitude: -77.0723, latitudeDelta: 0.01, longitudeDelta: 0.01 },
};

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: "red-square",
    campusId: CAMPUS.id,
    officialName: "Red Square",
    category: "landmark",
    description: "",
    latitude: 38.907,
    longitude: -77.0715,
    accessibilityFeatures: [],
    entrances: [],
    studentTips: [],
    openingHours: { summary: "" },
    isSaved: false,
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

function stubPlaceRepository(places: Place[]): PlaceRepository {
  return {
    async getPlacesByCampus() {
      return places;
    },
    async getPlaceById(id) {
      return places.find((p) => p.id === id);
    },
    async searchPlaces() {
      return [];
    },
    async getPlacesByCategory() {
      return [];
    },
  };
}

function stubCampusRepository(campus: Campus | undefined): CampusRepository {
  return {
    async getCampuses() {
      return campus ? [campus] : [];
    },
    async getCampusById() {
      return campus;
    },
    async getConstructionZones() {
      return [];
    },
    async getMockUsers() {
      return [];
    },
  };
}

describe("MockEventRepository", () => {
  it("returns seeded events for the campus, with coordinates resolved", async () => {
    const repo = new MockEventRepository(stubPlaceRepository([place()]), stubCampusRepository(CAMPUS), stubGeocoder);

    const events = await repo.getEvents(CAMPUS.id);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.coordinate).toBeDefined();
      expect(event.source).toBe("seed");
    }
  });

  it("returns nothing for a campus with no seeded events", async () => {
    const repo = new MockEventRepository(stubPlaceRepository([]), stubCampusRepository(CAMPUS), stubGeocoder);
    const events = await repo.getEvents("some-other-campus");
    expect(events).toEqual([]);
  });
});
