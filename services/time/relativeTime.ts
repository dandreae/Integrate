const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function unitLabel(value: number, unit: "min" | "hour" | "day" | "week"): string {
  // "min" is conventionally invariant ("12 min ago"), the rest pluralize normally.
  if (unit === "min") return "min";
  return value === 1 ? unit : `${unit}s`;
}

/**
 * Formats an ISO timestamp relative to `now` — "12 min ago" for the past,
 * "in 3 hours" for the future (used for expiration times). Deterministic
 * given an explicit `now`, so tests never depend on the real clock.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const targetMs = new Date(iso).getTime();
  if (Number.isNaN(targetMs)) return "Unknown time";

  const diffMs = targetMs - now.getTime();
  const absMs = Math.abs(diffMs);
  const isFuture = diffMs > 0;

  if (absMs < MINUTE_MS) return "just now";

  let value: number;
  let unit: "min" | "hour" | "day" | "week";
  if (absMs < HOUR_MS) {
    value = Math.round(absMs / MINUTE_MS);
    unit = "min";
  } else if (absMs < DAY_MS) {
    value = Math.round(absMs / HOUR_MS);
    unit = "hour";
  } else if (absMs < WEEK_MS) {
    value = Math.round(absMs / DAY_MS);
    unit = "day";
  } else {
    value = Math.round(absMs / WEEK_MS);
    unit = "week";
  }

  const label = `${value} ${unitLabel(value, unit)}`;
  return isFuture ? `in ${label}` : `${label} ago`;
}
