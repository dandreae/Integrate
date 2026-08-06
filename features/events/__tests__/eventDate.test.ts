import { describe, expect, it } from "vitest";
import { daysUntilEvent, formatRelativeEventDate, isPastEvent } from "../eventDate";

const NOW = new Date("2026-08-06T12:00:00");

describe("daysUntilEvent", () => {
  it("is 0 for today, positive for the future, negative for the past", () => {
    expect(daysUntilEvent("2026-08-06", NOW)).toBe(0);
    expect(daysUntilEvent("2026-08-07", NOW)).toBe(1);
    expect(daysUntilEvent("2026-07-30", NOW)).toBe(-7);
  });
});

describe("isPastEvent", () => {
  it("treats today as not past", () => {
    expect(isPastEvent("2026-08-06", NOW)).toBe(false);
  });
  it("treats yesterday as past", () => {
    expect(isPastEvent("2026-08-05", NOW)).toBe(true);
  });
});

describe("formatRelativeEventDate", () => {
  it("labels today, tomorrow, and near-term days", () => {
    expect(formatRelativeEventDate("2026-08-06", NOW)).toBe("Today");
    expect(formatRelativeEventDate("2026-08-07", NOW)).toBe("Tomorrow");
    expect(formatRelativeEventDate("2026-08-10", NOW)).toBe("In 4 days");
  });

  it("falls back to a plain date further out", () => {
    expect(formatRelativeEventDate("2026-08-28", NOW)).toBe("Aug 28");
  });

  it("labels past events distinctly", () => {
    expect(formatRelativeEventDate("2026-07-30", NOW)).toBe("Past event");
  });
});
