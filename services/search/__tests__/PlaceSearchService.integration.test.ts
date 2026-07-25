import { PLACES } from "@/data";
import { searchPlaces } from "../PlaceSearchService";

/**
 * Verifies the exact example queries from the campus-search spec resolve
 * correctly against the real mock campus dataset (not synthetic fixtures) —
 * a direct regression check that the shipped data actually supports the
 * scenarios it was written to demonstrate.
 */
describe("searchPlaces against real campus data", () => {
  it("'ICC' finds Intercultural Center", () => {
    const results = searchPlaces("ICC", PLACES);
    expect(results[0].place.id).toBe("intercultural-center");
  });

  it("'Leavey' finds Leavey Center", () => {
    const results = searchPlaces("Leavey", PLACES);
    expect(results[0].place.id).toBe("leavey-center");
  });

  it("'coffee near library' returns relevant coffee results", () => {
    const results = searchPlaces("coffee near library", PLACES);
    const ids = results.map((r) => r.place.id);
    expect(ids).toContain("saxbys-georgetown");
    expect(results.every((r) => r.place.category === "coffee")).toBe(true);
  });

  it("a local nickname ranks the correct place highly", () => {
    const results = searchPlaces("Lau", PLACES);
    expect(results[0].place.id).toBe("lauinger-library");
  });

  it("'JoCar' finds the John Carroll statue", () => {
    const results = searchPlaces("JoCar", PLACES);
    expect(results[0].place.id).toBe("john-carroll-statue");
  });
});
