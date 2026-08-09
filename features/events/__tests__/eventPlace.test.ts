import { describe, expect, it } from "vitest";
import type { CampusEvent, Place } from "@/types";
import { resolveEventPlace } from "../eventPlace";

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: "red-square",
    campusId: "georgetown-university",
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

function event(overrides: Partial<CampusEvent> = {}): CampusEvent {
  return {
    id: "e1",
    campusId: "georgetown-university",
    title: "Farmers Market",
    startAt: "2026-08-13T15:00:00.000Z",
    date: "2026-08-13",
    category: "market",
    expectedPopularity: "medium",
    source: "seed",
    ...overrides,
  };
}

describe("resolveEventPlace", () => {
  it("returns the curated place when locationId matches", () => {
    const result = resolveEventPlace(event({ locationId: "red-square" }), [place()]);
    expect(result?.id).toBe("red-square");
  });

  it("synthesizes a place from the event's coordinate when there's no curated match", () => {
    const result = resolveEventPlace(
      event({ locationLabel: "Arrupe Hall", coordinate: { latitude: 38.909, longitude: -77.071 } }),
      [place()]
    );
    expect(result?.id).toBe("event:e1");
    expect(result?.officialName).toBe("Arrupe Hall");
    expect(result?.latitude).toBe(38.909);
  });

  it("returns null when the event has neither a locationId nor a coordinate", () => {
    const result = resolveEventPlace(event(), [place()]);
    expect(result).toBeNull();
  });
});
