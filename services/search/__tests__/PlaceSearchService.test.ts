import { makePlace } from "@/test-utils/fixtures";
import { searchPlaces } from "../PlaceSearchService";

const intercultural = makePlace({
  id: "icc",
  officialName: "Intercultural Center",
  localName: "the ICC",
  aliases: ["ICC"],
  category: "academic",
  latitude: 38.9081,
  longitude: -77.0714,
  description: "Large academic building with lecture halls.",
});

const library = makePlace({
  id: "lau",
  officialName: "Lauinger Library",
  localName: "Lau",
  category: "study",
  latitude: 38.9084,
  longitude: -77.0722,
  description: "The main university library.",
  studentTips: ["Floors 3 and up are silent study."],
});

const coffeeNearLibrary = makePlace({
  id: "saxbys",
  officialName: "Saxbys Georgetown",
  localName: "Saxbys",
  category: "coffee",
  latitude: 38.9079,
  longitude: -77.0722, // ~55m south of the library
  description: "Campus coffee shop.",
});

const coffeeFar = makePlace({
  id: "midnight-mug",
  officialName: "Hoya Blue Coffee House",
  localName: "the Midnight Mug",
  category: "coffee",
  latitude: 38.86, // far away, well outside the "near" radius
  longitude: -77.05,
  description: "Late-night coffee spot.",
});

const gym = makePlace({
  id: "yates",
  officialName: "Yates Field House",
  category: "resource",
  latitude: 38.905,
  longitude: -77.075,
  description: "Fitness center with a pool and courts.",
  navigationTips: ["Enter through the lower level to reach the pool."],
});

const allPlaces = [intercultural, library, coffeeNearLibrary, coffeeFar, gym];

describe("searchPlaces", () => {
  it("returns all places unranked for an empty query", () => {
    const results = searchPlaces("", allPlaces);
    expect(results).toHaveLength(allPlaces.length);
    expect(results.every((r) => r.score === 0 && r.matchReason === "")).toBe(true);
  });

  it("finds a place by an exact abbreviation alias (ICC)", () => {
    const results = searchPlaces("ICC", allPlaces);
    expect(results[0].place.id).toBe("icc");
    expect(results[0].matchReason).toBe("Matched abbreviation");
  });

  it("is case-insensitive for alias matches", () => {
    const results = searchPlaces("icc", allPlaces);
    expect(results[0].place.id).toBe("icc");
  });

  it("ranks an exact local-name nickname match highest", () => {
    const results = searchPlaces("Lau", allPlaces);
    expect(results[0].place.id).toBe("lau");
    expect(results[0].matchReason).toBe("Matched local name");
  });

  it("matches by category label", () => {
    const results = searchPlaces("coffee", allPlaces);
    const ids = results.map((r) => r.place.id);
    expect(ids).toEqual(expect.arrayContaining(["saxbys", "midnight-mug"]));
    expect(results.find((r) => r.place.id === "saxbys")?.matchReason).toBe("Matched category");
  });

  it("matches by student tip / navigation tip keywords", () => {
    const results = searchPlaces("pool", allPlaces);
    expect(results[0].place.id).toBe("yates");
    expect(results[0].matchReason).toBe("Matched student tip");
  });

  it("does not return unrelated places for a specific query", () => {
    const results = searchPlaces("ICC", allPlaces);
    expect(results.some((r) => r.place.id === "yates")).toBe(false);
  });

  it("resolves a '<category> near <landmark>' query to nearby matching places", () => {
    const results = searchPlaces("coffee near library", allPlaces);
    const ids = results.map((r) => r.place.id);
    expect(ids).toContain("saxbys");
    expect(ids).not.toContain("midnight-mug"); // too far from the library
    expect(results.find((r) => r.place.id === "saxbys")?.matchReason).toBe("Near Lauinger Library");
  });

  it("falls back to plain ranking when no landmark can be resolved for a 'near' query", () => {
    const results = searchPlaces("coffee near nonexistentplace", allPlaces);
    const ids = results.map((r) => r.place.id);
    expect(ids).toEqual(expect.arrayContaining(["saxbys", "midnight-mug"]));
  });

  it("ranks a place matching in multiple ways above one matching in only one way", () => {
    const multiMatch = makePlace({
      id: "multi",
      officialName: "Study Commons",
      category: "study", // matches category keyword "study"
      latitude: 38.9,
      longitude: -77.07,
      description: "A quiet place to study.",
      studentTips: ["Great for group study sessions."], // also matches via tip
    });
    const singleMatch = makePlace({
      id: "single",
      officialName: "Random Hall",
      category: "academic",
      latitude: 38.91,
      longitude: -77.08,
      description: "Has a small study nook in the basement.", // matches via description only
    });

    const results = searchPlaces("study", [singleMatch, multiMatch]);
    expect(results[0].place.id).toBe("multi");
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
