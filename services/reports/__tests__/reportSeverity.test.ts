import { compareSeverityDescending, severityRank } from "../reportSeverity";

describe("severityRank", () => {
  it("ranks high above medium above low above undefined", () => {
    expect(severityRank("high")).toBeGreaterThan(severityRank("medium"));
    expect(severityRank("medium")).toBeGreaterThan(severityRank("low"));
    expect(severityRank("low")).toBeGreaterThan(severityRank(undefined));
  });
});

describe("compareSeverityDescending", () => {
  it("sorts most severe first", () => {
    const items: Array<"low" | "medium" | "high" | undefined> = [
      "low",
      "high",
      undefined,
      "medium",
    ];
    const sorted = [...items].sort(compareSeverityDescending);
    expect(sorted).toEqual(["high", "medium", "low", undefined]);
  });
});
