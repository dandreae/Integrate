const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * ISO timestamp N hours from the moment this is called (negative = past).
 * Seed data (events, discover posts) uses this instead of hardcoded ISO
 * strings so demo content never goes stale or drifts into "the past" just
 * because real time has moved on since it was written — and so a freshly
 * submitted post is always guaranteed to sort newer than any seeded one.
 */
export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * HOUR_MS).toISOString();
}

/** ISO timestamp N days from now (negative = past), pinned to a specific UTC hour for a realistic time-of-day. */
export function daysFromNow(days: number, hourUtc = 15): string {
  const date = new Date(Date.now() + days * DAY_MS);
  date.setUTCHours(hourUtc, 0, 0, 0);
  return date.toISOString();
}

/** The YYYY-MM-DD portion of an ISO timestamp — matches CampusEvent.date's contract ("derived from startAt"). */
export function isoDatePart(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}
