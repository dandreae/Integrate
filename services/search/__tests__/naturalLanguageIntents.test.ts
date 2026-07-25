import { PLACES } from "@/data";
import { searchPlaces } from "../PlaceSearchService";

/**
 * These check the exact conversational phrases the product spec calls out
 * (and that Demo Mode scripts) against the real campus dataset — a
 * regression here would be an embarrassing live-demo failure, not just a
 * unit-test nit.
 */
describe("natural-language search intents against real campus data", () => {
  it("'best coffee' returns only coffee shops with a 'Matched because' checklist", () => {
    const results = searchPlaces("best coffee", PLACES);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.place.category === "coffee")).toBe(true);
    expect(results[0].matchReasons).toBeTruthy();
    expect(results[0].matchReasons).toContain("Coffee shop");
  });

  it("'late night food' returns only places open late", () => {
    const results = searchPlaces("late night food", PLACES);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.matchReasons?.includes("Open late"))).toBe(true);
  });

  it("'quiet study' returns only study spaces", () => {
    const results = searchPlaces("quiet study", PLACES);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.place.category === "study")).toBe(true);
  });

  it("'closest bathroom' returns places with an accessible restroom", () => {
    const results = searchPlaces("closest bathroom", PLACES);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.place.accessibilityFeatures.includes("accessible-restroom"))).toBe(true);
  });

  it("'where should I eat' returns only dining places", () => {
    const results = searchPlaces("where should I eat", PLACES);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.place.category === "dining")).toBe(true);
  });

  it("'freshman classes' returns only academic buildings", () => {
    const results = searchPlaces("freshman classes", PLACES);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.place.category === "academic")).toBe(true);
  });

  it("'wheelchair entrance' returns only places with an accessible entrance", () => {
    const results = searchPlaces("wheelchair entrance", PLACES);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.place.entrances.some((e) => e.isAccessible))).toBe(true);
  });

  it("sorts intent results by proximity when a user location is given", () => {
    // Somewhere near Saxbys, closer than the other coffee shops.
    const nearSaxbys = { latitude: 38.9079, longitude: -77.0722 };
    const results = searchPlaces("best coffee", PLACES, { userLocation: nearSaxbys });
    expect(results[0].place.id).toBe("saxbys-georgetown");
    expect(results[0].matchReasons).toContain("Nearby");
  });

  it("a query with no recognized intent falls back to normal ranking", () => {
    const results = searchPlaces("Lauinger Library", PLACES);
    expect(results[0].place.id).toBe("lauinger-library");
    expect(results[0].matchReasons).toBeUndefined();
  });
});
