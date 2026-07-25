import type { CampusReport, ExpectedDurationOption, ReportLifecycleStatus } from "@/types";
import { formatRelativeTime } from "@/services/time/relativeTime";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const EXPECTED_DURATION_OPTIONS: ExpectedDurationOption[] = [
  "Less than 1 hour",
  "Today",
  "Several days",
  "Unknown",
];

/**
 * Converts an expected-duration selection into a concrete expiration
 * timestamp, relative to when the report was submitted. "Unknown" has no
 * natural expiration — it stays active until resolved or manually cleared.
 */
export function expectedDurationToExpiresAt(
  option: ExpectedDurationOption,
  submittedAt: Date
): string | undefined {
  switch (option) {
    case "Less than 1 hour":
      return new Date(submittedAt.getTime() + HOUR_MS).toISOString();
    case "Today": {
      const endOfDay = new Date(submittedAt);
      endOfDay.setHours(23, 59, 59, 999);
      // Guarantee at least an hour of life even if submitted late at night.
      const minimumExpiry = submittedAt.getTime() + HOUR_MS;
      return new Date(Math.max(endOfDay.getTime(), minimumExpiry)).toISOString();
    }
    case "Several days":
      return new Date(submittedAt.getTime() + 4 * DAY_MS).toISOString();
    case "Unknown":
    default:
      return undefined;
  }
}

export function isReportExpired(report: CampusReport, now: Date = new Date()): boolean {
  if (!report.expiresAt) return false;
  const expiresAtMs = new Date(report.expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return false;
  return expiresAtMs <= now.getTime();
}

/**
 * The report's *effective* lifecycle status. Expiration is computed live
 * from `expiresAt` against `now` rather than trusted from a possibly-stale
 * stored value, so nothing needs a background job to "expire" reports on
 * schedule — the very next read just sees the truth.
 */
export function getEffectiveLifecycleStatus(
  report: CampusReport,
  now: Date = new Date()
): ReportLifecycleStatus {
  if (report.lifecycleStatus === "resolved") return "resolved";
  if (isReportExpired(report, now)) return "expired";
  return report.lifecycleStatus;
}

export function isReportActive(report: CampusReport, now: Date = new Date()): boolean {
  return getEffectiveLifecycleStatus(report, now) === "active";
}

export function formatExpiration(report: CampusReport, now: Date = new Date()): string {
  if (!report.expiresAt) return "No set expiration";
  const relative = formatRelativeTime(report.expiresAt, now);
  return isReportExpired(report, now) ? `Expired ${relative}` : `Expires ${relative}`;
}
