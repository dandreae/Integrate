import { describe, expect, it } from "vitest";
import { formatRelativePostTime, isExpiredPost } from "../postTime";

const NOW = new Date("2026-08-06T12:00:00.000Z");

describe("formatRelativePostTime", () => {
  it("labels very recent posts as Just now", () => {
    expect(formatRelativePostTime("2026-08-06T11:59:30.000Z", NOW)).toBe("Just now");
  });

  it("labels minutes and hours ago", () => {
    expect(formatRelativePostTime("2026-08-06T11:45:00.000Z", NOW)).toBe("15m ago");
    expect(formatRelativePostTime("2026-08-06T09:00:00.000Z", NOW)).toBe("3h ago");
  });

  it("labels days ago within a week", () => {
    expect(formatRelativePostTime("2026-08-04T12:00:00.000Z", NOW)).toBe("2d ago");
  });

  it("falls back to a plain date beyond a week", () => {
    expect(formatRelativePostTime("2026-07-20T12:00:00.000Z", NOW)).toBe("Jul 20");
  });
});

describe("isExpiredPost", () => {
  it("is false with no expiry", () => {
    expect(isExpiredPost(undefined, NOW)).toBe(false);
  });
  it("is false for a future expiry", () => {
    expect(isExpiredPost("2026-08-10T00:00:00.000Z", NOW)).toBe(false);
  });
  it("is true for a past expiry", () => {
    expect(isExpiredPost("2026-08-01T00:00:00.000Z", NOW)).toBe(true);
  });
});
