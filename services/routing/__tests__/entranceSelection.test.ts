import { describe, expect, it } from "vitest";
import type { Place } from "@/types";
import { selectCandidateEntrances } from "../entranceSelection";

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: "test-place",
    campusId: "campus",
    officialName: "Test Place",
    category: "academic",
    description: "",
    latitude: 38.9,
    longitude: -77.07,
    accessibilityFeatures: [],
    entrances: [],
    studentTips: [],
    openingHours: { summary: "" },
    isSaved: false,
    ...overrides,
  };
}

describe("selectCandidateEntrances", () => {
  it("falls back to the place centroid when there is no entrance data", () => {
    const p = place();
    const fastest = selectCandidateEntrances(p, "fastest");
    const accessible = selectCandidateEntrances(p, "accessible");

    expect(fastest).toHaveLength(1);
    expect(fastest[0].isKnownEntrance).toBe(false);
    expect(fastest[0].point).toEqual({ latitude: p.latitude, longitude: p.longitude });
    expect(accessible).toEqual(fastest);
  });

  it("fastest considers every known entrance", () => {
    const p = place({
      entrances: [
        { id: "e1", placeId: "test-place", latitude: 38.901, longitude: -77.071, label: "Main", isAccessible: false },
        { id: "e2", placeId: "test-place", latitude: 38.902, longitude: -77.072, label: "Ramp", isAccessible: true },
      ],
    });
    const result = selectCandidateEntrances(p, "fastest");
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.isKnownEntrance)).toBe(true);
  });

  it("accessible only returns accessible entrances when at least one exists", () => {
    const p = place({
      entrances: [
        { id: "e1", placeId: "test-place", latitude: 38.901, longitude: -77.071, label: "Main", isAccessible: false },
        { id: "e2", placeId: "test-place", latitude: 38.902, longitude: -77.072, label: "Ramp", isAccessible: true },
      ],
    });
    const result = selectCandidateEntrances(p, "accessible");
    expect(result).toHaveLength(1);
    expect(result[0].entrance?.id).toBe("e2");
  });

  it("accessible falls back to all entrances (not centroid) when none are marked accessible", () => {
    const p = place({
      entrances: [
        { id: "e1", placeId: "test-place", latitude: 38.901, longitude: -77.071, label: "Main", isAccessible: false },
        { id: "e2", placeId: "test-place", latitude: 38.902, longitude: -77.072, label: "Side", isAccessible: false },
      ],
    });
    const result = selectCandidateEntrances(p, "mostAccessible");
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.isKnownEntrance && !c.entrance?.isAccessible)).toBe(true);
  });
});
