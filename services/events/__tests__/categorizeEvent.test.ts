import { describe, expect, it } from "vitest";
import { categorizeEvent } from "../categorizeEvent";

describe("categorizeEvent", () => {
  it("classifies sports events by keyword", () => {
    expect(categorizeEvent("Hoyas Basketball vs. Villanova")).toBe("sports");
  });

  it("classifies concerts by keyword", () => {
    expect(categorizeEvent("Fall Kickoff Concert")).toBe("concert");
  });

  it("classifies markets by keyword", () => {
    expect(categorizeEvent("Georgetown Farmers Market")).toBe("market");
  });

  it("classifies academic events by keyword", () => {
    expect(categorizeEvent("Faculty Research Symposium")).toBe("academic");
  });

  it("classifies meetings by keyword", () => {
    expect(categorizeEvent("New Student Orientation Town Hall")).toBe("meeting");
  });

  it("classifies social events by keyword", () => {
    expect(categorizeEvent("Homecoming Reception")).toBe("social");
  });

  it("checks tags in addition to the title", () => {
    expect(categorizeEvent("Untitled Gathering", ["concert"])).toBe("concert");
  });

  it("falls back to other when nothing matches", () => {
    expect(categorizeEvent("MBA Fall 2027 Recruitment Updates")).toBe("other");
  });
});
