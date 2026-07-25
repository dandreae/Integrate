import { makeReport } from "@/test-utils/fixtures";
import {
  expectedDurationToExpiresAt,
  formatExpiration,
  getEffectiveLifecycleStatus,
  isReportActive,
  isReportExpired,
} from "../reportLifecycle";

const SUBMITTED_AT = new Date("2026-07-20T12:00:00.000Z");
const NOW = new Date("2026-07-22T12:00:00.000Z");

describe("expectedDurationToExpiresAt", () => {
  it("'Less than 1 hour' expires exactly one hour after submission", () => {
    const expiresAt = expectedDurationToExpiresAt("Less than 1 hour", SUBMITTED_AT);
    expect(expiresAt).toBe(new Date(SUBMITTED_AT.getTime() + 60 * 60 * 1000).toISOString());
  });

  it("'Today' expires at the end of the submission day", () => {
    const expiresAt = expectedDurationToExpiresAt("Today", SUBMITTED_AT);
    expect(expiresAt).toBeTruthy();
    const expiresDate = new Date(expiresAt!);
    expect(expiresDate.getDate()).toBe(SUBMITTED_AT.getDate());
    expect(expiresDate.getHours()).toBe(23);
  });

  it("'Several days' expires four days after submission", () => {
    const expiresAt = expectedDurationToExpiresAt("Several days", SUBMITTED_AT);
    expect(expiresAt).toBe(new Date(SUBMITTED_AT.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString());
  });

  it("'Unknown' has no expiration", () => {
    expect(expectedDurationToExpiresAt("Unknown", SUBMITTED_AT)).toBeUndefined();
  });
});

describe("isReportExpired / getEffectiveLifecycleStatus / isReportActive", () => {
  it("a report with no expiresAt is never expired", () => {
    const report = makeReport({
      id: "r1",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      lifecycleStatus: "active",
    });
    expect(isReportExpired(report, NOW)).toBe(false);
    expect(isReportActive(report, NOW)).toBe(true);
  });

  it("a report whose expiresAt is in the future is not expired", () => {
    const report = makeReport({
      id: "r2",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      lifecycleStatus: "active",
      expiresAt: "2026-07-23T00:00:00.000Z",
    });
    expect(isReportExpired(report, NOW)).toBe(false);
    expect(getEffectiveLifecycleStatus(report, NOW)).toBe("active");
    expect(isReportActive(report, NOW)).toBe(true);
  });

  it("a report whose expiresAt is in the past is expired, even if stored as active", () => {
    const report = makeReport({
      id: "r3",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      lifecycleStatus: "active",
      expiresAt: "2026-07-21T00:00:00.000Z",
    });
    expect(isReportExpired(report, NOW)).toBe(true);
    expect(getEffectiveLifecycleStatus(report, NOW)).toBe("expired");
    expect(isReportActive(report, NOW)).toBe(false);
  });

  it("a resolved report stays resolved even with a future expiresAt", () => {
    const report = makeReport({
      id: "r4",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      lifecycleStatus: "resolved",
      expiresAt: "2026-08-01T00:00:00.000Z",
    });
    expect(getEffectiveLifecycleStatus(report, NOW)).toBe("resolved");
    expect(isReportActive(report, NOW)).toBe(false);
  });
});

describe("formatExpiration", () => {
  it("reports no expiration when unset", () => {
    const report = makeReport({
      id: "r5",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
    });
    expect(formatExpiration(report, NOW)).toBe("No set expiration");
  });

  it("formats a future expiration as 'Expires in ...'", () => {
    const report = makeReport({
      id: "r6",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      expiresAt: new Date(NOW.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    });
    expect(formatExpiration(report, NOW)).toBe("Expires in 3 hours");
  });

  it("formats a past expiration as 'Expired ... ago'", () => {
    const report = makeReport({
      id: "r7",
      issueType: "other",
      relatedEntity: { type: "general", id: "x", label: "X" },
      expiresAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    });
    expect(formatExpiration(report, NOW)).toBe("Expired 2 hours ago");
  });
});
