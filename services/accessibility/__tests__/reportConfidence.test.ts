import { describe, expect, it } from "vitest";
import type { AccessibilityReport } from "@/types";
import {
  computeExpiresAt,
  getReportConfidence,
  isEffectivelyActive,
  isReportExpired,
  shouldDisplayReport,
} from "../reportConfidence";

const NOW = new Date("2026-08-08T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS).toISOString();
const daysFromNow = (days: number) => new Date(NOW.getTime() + days * DAY_MS).toISOString();

function report(overrides: Partial<AccessibilityReport> = {}): AccessibilityReport {
  return {
    id: "r1",
    placeId: "p1",
    issueType: "elevator-out",
    description: "Elevator is out of service.",
    severity: "medium",
    reportedAt: daysAgo(1),
    lastConfirmedAt: daysAgo(1),
    expiresAt: daysFromNow(6),
    status: "active",
    confirmCount: 0,
    fixedCount: 0,
    ...overrides,
  };
}

describe("computeExpiresAt", () => {
  it("adds the severity-specific window in days", () => {
    const from = "2026-08-01T00:00:00.000Z";
    expect(computeExpiresAt(from, "low")).toBe("2026-08-04T00:00:00.000Z");
    expect(computeExpiresAt(from, "medium")).toBe("2026-08-08T00:00:00.000Z");
    expect(computeExpiresAt(from, "high")).toBe("2026-08-15T00:00:00.000Z");
  });
});

describe("isReportExpired / isEffectivelyActive", () => {
  it("is not expired before expiresAt, expired at/after it", () => {
    expect(isReportExpired(report({ expiresAt: daysFromNow(1) }), NOW)).toBe(false);
    expect(isReportExpired(report({ expiresAt: daysAgo(1) }), NOW)).toBe(true);
  });

  it("is effectively active only when status is active and not expired", () => {
    expect(isEffectivelyActive(report({ status: "active", expiresAt: daysFromNow(1) }), NOW)).toBe(true);
    expect(isEffectivelyActive(report({ status: "active", expiresAt: daysAgo(1) }), NOW)).toBe(false);
    expect(isEffectivelyActive(report({ status: "resolved", expiresAt: daysFromNow(1) }), NOW)).toBe(false);
  });
});

describe("getReportConfidence", () => {
  it("is critical for multiple recent confirmations on an active report", () => {
    const r = report({ confirmCount: 3, lastConfirmedAt: daysAgo(1) });
    expect(getReportConfidence(r, NOW)).toBe("critical");
  });

  it("downgrades to community when confirmations are numerous but stale", () => {
    // High confirmCount, but nobody has reconfirmed recently — this is the
    // "haven't been recently confirmed" downgrade the feature exists for.
    const r = report({ confirmCount: 5, lastConfirmedAt: daysAgo(10), expiresAt: daysFromNow(4) });
    expect(getReportConfidence(r, NOW)).toBe("community");
  });

  it("is community for a single fresh report", () => {
    const r = report({ confirmCount: 0, lastConfirmedAt: daysAgo(1) });
    expect(getReportConfidence(r, NOW)).toBe("community");
  });

  it("is null (hidden) once an active report has expired", () => {
    const r = report({ expiresAt: daysAgo(1) });
    expect(getReportConfidence(r, NOW)).toBeNull();
    expect(shouldDisplayReport(r, NOW)).toBe(false);
  });

  it("is verified for a report resolved recently", () => {
    const r = report({ status: "resolved", resolvedAt: daysAgo(1), lastConfirmedAt: daysAgo(1) });
    expect(getReportConfidence(r, NOW)).toBe("verified");
    expect(shouldDisplayReport(r, NOW)).toBe(true);
  });

  it("is null for a report resolved too long ago to still be relevant", () => {
    const r = report({ status: "resolved", resolvedAt: daysAgo(30), lastConfirmedAt: daysAgo(30) });
    expect(getReportConfidence(r, NOW)).toBeNull();
  });
});
