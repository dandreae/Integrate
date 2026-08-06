import { describe, expect, it } from "vitest";
import { looksLikeAbbreviation, matchesAbbreviation } from "../abbreviationMatch";

describe("looksLikeAbbreviation", () => {
  it("accepts short letters-only strings", () => {
    expect(looksLikeAbbreviation("ICC")).toBe(true);
    expect(looksLikeAbbreviation("ll")).toBe(true);
  });

  it("rejects queries with spaces, numbers, or that are too long/short", () => {
    expect(looksLikeAbbreviation("Intercultural Center")).toBe(false);
    expect(looksLikeAbbreviation("A")).toBe(false);
    expect(looksLikeAbbreviation("TOOLONGWORD")).toBe(false);
    expect(looksLikeAbbreviation("I9")).toBe(false);
  });
});

describe("matchesAbbreviation", () => {
  it("matches an abbreviation to a real building via initials, dropping a donor-name prefix", () => {
    // The concrete case that motivated this: OSM only has "Bunn Intercultural
    // Center" — no alt_name/short_name — yet students say "ICC". Collapsing
    // the doubled letter and dropping the donor-name prefix "Bunn" derives
    // "IC", which is exactly ICC with its repeat collapsed.
    expect(matchesAbbreviation("ICC", "Bunn Intercultural Center")).toBe(true);
  });

  it("matches plain two-letter initials", () => {
    expect(matchesAbbreviation("RL", "Riggs Library")).toBe(true);
    expect(matchesAbbreviation("CH", "Copley Hall")).toBe(true);
  });

  it("matches after dropping a generic trailing word", () => {
    expect(matchesAbbreviation("YFH", "Yates Field House")).toBe(true);
  });

  it("does not match unrelated names", () => {
    expect(matchesAbbreviation("ICC", "The Tombs")).toBe(false);
    expect(matchesAbbreviation("XYZ", "Healy Hall")).toBe(false);
  });

  it("ignores stopwords when computing initials", () => {
    expect(matchesAbbreviation("VBLD", "Volta Bureau Library for the Deaf")).toBe(true);
  });

  it("refuses to run on queries that don't look like abbreviations (e.g. full words with spaces)", () => {
    expect(matchesAbbreviation("Healy Hall", "Healy Hall")).toBe(false);
  });
});
