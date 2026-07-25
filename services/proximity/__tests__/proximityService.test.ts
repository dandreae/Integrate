import { makePlace } from "@/test-utils/fixtures";
import { findNearbyPlaces } from "../proximityService";

const origin = makePlace({
  id: "origin",
  officialName: "Origin Hall",
  category: "academic",
  latitude: 38.9084,
  longitude: -77.0722,
});

const closeCoffee = makePlace({
  id: "close-coffee",
  officialName: "Close Coffee",
  category: "coffee",
  latitude: 38.9085, // ~11m away
  longitude: -77.0722,
});

const closerCoffee = makePlace({
  id: "closer-coffee",
  officialName: "Closer Coffee",
  category: "coffee",
  latitude: 38.90845, // ~5m away
  longitude: -77.0722,
});

const studySpace = makePlace({
  id: "study-space",
  officialName: "Quiet Study Hall",
  category: "study",
  latitude: 38.909, // further away
  longitude: -77.0722,
});

const accessibleRestroomPlace = makePlace({
  id: "restroom-place",
  officialName: "Facilities Building",
  category: "resource",
  accessibilityFeatures: ["accessible-restroom"],
  latitude: 38.9095,
  longitude: -77.0722,
});

const landmark = makePlace({
  id: "landmark",
  officialName: "Old Statue",
  category: "landmark",
  latitude: 38.91,
  longitude: -77.0722,
});

const farAway = makePlace({
  id: "far-away",
  officialName: "Far Building",
  category: "academic",
  latitude: 39.0,
  longitude: -77.2,
});

const allCandidates = [closeCoffee, closerCoffee, studySpace, accessibleRestroomPlace, landmark, farAway];

describe("findNearbyPlaces", () => {
  it("excludes the origin place itself", () => {
    const results = findNearbyPlaces(origin, [origin, closeCoffee]);
    expect(results.some((r) => r.place.id === origin.id)).toBe(false);
  });

  it("sorts by distance ascending in the final result", () => {
    const results = findNearbyPlaces(origin, allCandidates, { limit: 6 });
    const distances = results.map((r) => r.distanceMeters);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });

  it("respects the limit", () => {
    const results = findNearbyPlaces(origin, allCandidates, { limit: 2 });
    expect(results).toHaveLength(2);
  });

  it("defaults to a limit of 4", () => {
    const results = findNearbyPlaces(origin, allCandidates);
    expect(results.length).toBeLessThanOrEqual(4);
  });

  it("picks only the closest coffee place for the 'Nearby coffee' slot, not both", () => {
    const results = findNearbyPlaces(origin, allCandidates, { limit: 4 });
    const coffeeResults = results.filter((r) => r.place.category === "coffee");
    expect(coffeeResults).toHaveLength(1);
    expect(coffeeResults[0].place.id).toBe("closer-coffee");
    expect(coffeeResults[0].reason).toBe("Nearby coffee");
  });

  it("labels the study space slot as 'Closest study space'", () => {
    const results = findNearbyPlaces(origin, allCandidates, { limit: 4 });
    const study = results.find((r) => r.place.id === "study-space");
    expect(study?.reason).toBe("Closest study space");
  });

  it("surfaces a place with an accessible restroom regardless of its category", () => {
    const results = findNearbyPlaces(origin, allCandidates, { limit: 4 });
    const restroom = results.find((r) => r.place.id === "restroom-place");
    expect(restroom?.reason).toBe("Nearby accessible restroom");
  });

  it("labels a landmark slot as 'Nearby landmark'", () => {
    const results = findNearbyPlaces(origin, allCandidates, { limit: 5 });
    const landmarkResult = results.find((r) => r.place.id === "landmark");
    expect(landmarkResult?.reason).toBe("Nearby landmark");
  });

  it("prioritizes curated ids before diverse-category slots", () => {
    const results = findNearbyPlaces(origin, allCandidates, {
      limit: 1,
      curatedIds: ["far-away"],
    });
    expect(results).toHaveLength(1);
    expect(results[0].place.id).toBe("far-away");
    expect(results[0].reason).toBe("Nearby");
  });

  it("does not duplicate a place already used by a curated pick", () => {
    const results = findNearbyPlaces(origin, allCandidates, {
      limit: 4,
      curatedIds: ["closer-coffee"],
    });
    const ids = results.map((r) => r.place.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
