import { describe, expect, it } from "vitest";
import type { Campus, CampusEvent, Place } from "@/types";
import type { GeocodingProvider } from "@/services/geocoding";
import { resolveEventLocation } from "../eventLocationResolver";

const CAMPUS: Campus = {
  id: "georgetown-university",
  name: "Georgetown University",
  latitude: 38.9076,
  longitude: -77.0723,
  mapRegion: { latitude: 38.9076, longitude: -77.0723, latitudeDelta: 0.01, longitudeDelta: 0.01 },
};

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: "arrupe-hall",
    campusId: CAMPUS.id,
    officialName: "Arrupe Hall",
    category: "academic",
    description: "",
    latitude: 38.908,
    longitude: -77.072,
    accessibilityFeatures: [],
    entrances: [],
    studentTips: [],
    openingHours: { summary: "" },
    isSaved: false,
    ...overrides,
  };
}

function event(overrides: Partial<CampusEvent> = {}): CampusEvent {
  return {
    id: "e1",
    campusId: CAMPUS.id,
    title: "Conflict Management Workshop",
    startAt: "2026-08-11T12:00:00.000Z",
    date: "2026-08-11",
    category: "academic",
    expectedPopularity: "medium",
    source: "georgetown-livewhale",
    ...overrides,
  };
}

function stubGeocoder(results: { name: string; latitude: number; longitude: number }[]): GeocodingProvider {
  return {
    name: "stub",
    async search() {
      return results;
    },
    async reverse() {
      return results[0] ?? null;
    },
  };
}

describe("resolveEventLocation", () => {
  it("resolves via an already-set locationId", async () => {
    const result = await resolveEventLocation(
      event({ locationId: "arrupe-hall" }),
      [place()],
      CAMPUS,
      stubGeocoder([])
    );
    expect(result.coordinate).toEqual({ latitude: 38.908, longitude: -77.072 });
    expect(result.locationConfidence).toBe("exact");
  });

  it("trusts a coordinate the source already gave", async () => {
    const result = await resolveEventLocation(
      event({ coordinate: { latitude: 38.91, longitude: -77.07 } }),
      [place()],
      CAMPUS,
      stubGeocoder([])
    );
    expect(result.coordinate).toEqual({ latitude: 38.91, longitude: -77.07 });
    expect(result.locationConfidence).toBe("exact");
  });

  it("matches a curated place by substring in the free-text location", async () => {
    const result = await resolveEventLocation(
      event({ locationLabel: "Arrupe Hall Multipurpose Room" }),
      [place()],
      CAMPUS,
      stubGeocoder([])
    );
    expect(result.locationId).toBe("arrupe-hall");
    expect(result.locationConfidence).toBe("exact");
  });

  it("falls back to geocoding the free-text location when no curated place matches", async () => {
    const result = await resolveEventLocation(
      event({ locationLabel: "Some Unlisted Building" }),
      [place()],
      CAMPUS,
      stubGeocoder([{ name: "Some Unlisted Building", latitude: 38.91, longitude: -77.075 }])
    );
    expect(result.coordinate).toEqual({ latitude: 38.91, longitude: -77.075 });
    expect(result.locationConfidence).toBe("geocoded");
  });

  it("falls back to the campus centroid when nothing resolves", async () => {
    const result = await resolveEventLocation(event(), [place()], CAMPUS, stubGeocoder([]));
    expect(result.coordinate).toEqual({ latitude: CAMPUS.latitude, longitude: CAMPUS.longitude });
    expect(result.locationConfidence).toBe("approximate");
  });

  it("degrades to approximate rather than throwing when geocoding fails", async () => {
    const failingGeocoder: GeocodingProvider = {
      name: "stub",
      async search() {
        throw new Error("network down");
      },
      async reverse() {
        return null;
      },
    };
    const result = await resolveEventLocation(
      event({ locationLabel: "Some Unlisted Building" }),
      [place()],
      CAMPUS,
      failingGeocoder
    );
    expect(result.locationConfidence).toBe("approximate");
  });
});
