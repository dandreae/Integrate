import { formatRelativeTime } from "../relativeTime";

const NOW = new Date("2026-07-22T12:00:00.000Z");

function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60 * 1000).toISOString();
}
function minutesFromNow(minutes: number): string {
  return new Date(NOW.getTime() + minutes * 60 * 1000).toISOString();
}

describe("formatRelativeTime", () => {
  it("returns 'just now' for under a minute", () => {
    expect(formatRelativeTime(minutesAgo(0.5), NOW)).toBe("just now");
  });

  it("formats minutes ago without pluralizing 'min'", () => {
    expect(formatRelativeTime(minutesAgo(12), NOW)).toBe("12 min ago");
    expect(formatRelativeTime(minutesAgo(1), NOW)).toBe("1 min ago");
  });

  it("formats hours ago, pluralized", () => {
    expect(formatRelativeTime(minutesAgo(60), NOW)).toBe("1 hour ago");
    expect(formatRelativeTime(minutesAgo(180), NOW)).toBe("3 hours ago");
  });

  it("formats days ago, pluralized", () => {
    expect(formatRelativeTime(minutesAgo(60 * 24 * 3), NOW)).toBe("3 days ago");
  });

  it("formats weeks ago, pluralized", () => {
    expect(formatRelativeTime(minutesAgo(60 * 24 * 14), NOW)).toBe("2 weeks ago");
  });

  it("formats future timestamps as 'in X'", () => {
    expect(formatRelativeTime(minutesFromNow(45), NOW)).toBe("in 45 min");
    expect(formatRelativeTime(minutesFromNow(60 * 3), NOW)).toBe("in 3 hours");
  });

  it("returns a safe fallback for an unparsable date", () => {
    expect(formatRelativeTime("not-a-date", NOW)).toBe("Unknown time");
  });

  it("defaults `now` to the current time when omitted", () => {
    const result = formatRelativeTime(new Date().toISOString());
    expect(result).toBe("just now");
  });
});
