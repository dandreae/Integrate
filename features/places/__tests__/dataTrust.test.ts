import { makeReport } from "@/test-utils/fixtures";
import {
  DEFAULT_OUTDATED_THRESHOLD_DAYS,
  getConfidenceBadge,
  getPlaceTrustSignals,
  getVerificationStatusBadge,
  hasActiveAccessibilityReport,
  isDataOutdated,
} from "../dataTrust";

const NOW = new Date("2026-07-22T12:00:00.000Z");
const FRESH_DATE = "2026-07-01T00:00:00.000Z"; // 21 days before NOW
const OUTDATED_DATE = "2025-01-01T00:00:00.000Z"; // well over a year before NOW

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

describe("isDataOutdated", () => {
  it("returns false for data verified today", () => {
    expect(isDataOutdated(daysAgoIso(0))).toBe(false);
  });

  it("returns false for data just under the default threshold", () => {
    expect(isDataOutdated(daysAgoIso(DEFAULT_OUTDATED_THRESHOLD_DAYS - 1))).toBe(false);
  });

  it("returns true for data past the default threshold", () => {
    expect(isDataOutdated(daysAgoIso(DEFAULT_OUTDATED_THRESHOLD_DAYS + 1))).toBe(true);
  });

  it("respects a custom threshold", () => {
    expect(isDataOutdated(daysAgoIso(10), 5)).toBe(true);
    expect(isDataOutdated(daysAgoIso(3), 5)).toBe(false);
  });

  it("treats an unparsable date as not outdated rather than throwing", () => {
    expect(isDataOutdated("not-a-date")).toBe(false);
  });
});

describe("getVerificationStatusBadge", () => {
  it("returns a 'Verified' badge for fresh data", () => {
    const badge = getVerificationStatusBadge(daysAgoIso(1));
    expect(badge.label).toBe("Verified");
    expect(badge.icon).toBeTruthy();
    expect(badge.tone).toBe("accessible");
  });

  it("returns a 'May be outdated' badge for stale data, pairing an icon with the text", () => {
    const badge = getVerificationStatusBadge(daysAgoIso(DEFAULT_OUTDATED_THRESHOLD_DAYS + 30));
    expect(badge.label).toBe("May be outdated");
    expect(badge.icon).toBeTruthy();
    expect(badge.tone).toBe("warning");
  });
});

describe("getConfidenceBadge", () => {
  it("returns distinct label/icon/tone for each confidence level", () => {
    const high = getConfidenceBadge("high");
    const medium = getConfidenceBadge("medium");
    const low = getConfidenceBadge("low");

    expect(new Set([high.label, medium.label, low.label]).size).toBe(3);
    expect(new Set([high.icon, medium.icon, low.icon]).size).toBe(3);
    expect(new Set([high.tone, medium.tone, low.tone]).size).toBe(3);
  });
});

describe("hasActiveAccessibilityReport", () => {
  it("is true when an active report has an accessibility-related issue type", () => {
    const reports = [
      makeReport({
        id: "r1",
        issueType: "ramp-blocked",
        relatedEntity: { type: "place", id: "p1", label: "P1" },
        lifecycleStatus: "active",
      }),
    ];
    expect(hasActiveAccessibilityReport(reports, NOW)).toBe(true);
  });

  it("is false when the only accessibility report is resolved", () => {
    const reports = [
      makeReport({
        id: "r2",
        issueType: "elevator-unavailable",
        relatedEntity: { type: "place", id: "p1", label: "P1" },
        lifecycleStatus: "resolved",
      }),
    ];
    expect(hasActiveAccessibilityReport(reports, NOW)).toBe(false);
  });

  it("is false for active reports that aren't accessibility-related", () => {
    const reports = [
      makeReport({
        id: "r3",
        issueType: "incorrect-info",
        relatedEntity: { type: "place", id: "p1", label: "P1" },
        lifecycleStatus: "active",
      }),
    ];
    expect(hasActiveAccessibilityReport(reports, NOW)).toBe(false);
  });

  it("is false for an empty report list", () => {
    expect(hasActiveAccessibilityReport([], NOW)).toBe(false);
  });
});

describe("getPlaceTrustSignals", () => {
  it("flags outdated accessibility data", () => {
    const signals = getPlaceTrustSignals(
      { dataLastVerifiedAt: OUTDATED_DATE, verificationSource: "Old survey", confidenceLevel: "high" },
      false,
      { now: NOW }
    );
    expect(signals.some((s) => s.kind === "outdated")).toBe(true);
    const outdated = signals.find((s) => s.kind === "outdated")!;
    expect(outdated.label).toBe("Accessibility info may be outdated");
    expect(outdated.icon).toBeTruthy();
    expect(outdated.tone).toBe("warning");
    expect(outdated.explanation).toContain(OUTDATED_DATE);
  });

  it("flags low-confidence entrance data", () => {
    const signals = getPlaceTrustSignals(
      { dataLastVerifiedAt: FRESH_DATE, verificationSource: "Student submission", confidenceLevel: "low" },
      false,
      { now: NOW }
    );
    expect(signals.some((s) => s.kind === "lowConfidenceEntrance")).toBe(true);
    const lowConfidence = signals.find((s) => s.kind === "lowConfidenceEntrance")!;
    expect(lowConfidence.label).toBe("Entrance data is low confidence");
  });

  it("flags an active unverified accessibility report", () => {
    const signals = getPlaceTrustSignals(
      { dataLastVerifiedAt: FRESH_DATE, verificationSource: "Campus Facilities", confidenceLevel: "high" },
      true,
      { now: NOW }
    );
    expect(signals.some((s) => s.kind === "unverifiedReport")).toBe(true);
    const reportSignal = signals.find((s) => s.kind === "unverifiedReport")!;
    expect(reportSignal.label).toBe("Unverified accessibility report");
    expect(reportSignal.tone).toBe("danger");
  });

  it("returns no signals for healthy, fresh, high-confidence data with no reports", () => {
    const signals = getPlaceTrustSignals(
      { dataLastVerifiedAt: FRESH_DATE, verificationSource: "Campus Facilities", confidenceLevel: "high" },
      false,
      { now: NOW }
    );
    expect(signals).toEqual([]);
  });

  it("can return multiple signals at once", () => {
    const signals = getPlaceTrustSignals(
      { dataLastVerifiedAt: OUTDATED_DATE, verificationSource: "Old survey", confidenceLevel: "low" },
      true,
      { now: NOW }
    );
    expect(signals).toHaveLength(3);
  });
});
