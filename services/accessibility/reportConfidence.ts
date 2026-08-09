import type { AccessibilityReport, AccessibilityReportConfidence, AccessibilityReportSeverity } from "@/types";
import { ACCESSIBILITY_REPORT_CONFIG } from "@/constants/accessibilityReports";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Computes the expiration timestamp for a report whose freshness clock (`lastConfirmedAt`) was just set to `from`. */
export function computeExpiresAt(from: string | Date, severity: AccessibilityReportSeverity): string {
  const fromMs = typeof from === "string" ? new Date(from).getTime() : from.getTime();
  const windowDays = ACCESSIBILITY_REPORT_CONFIG.expirationDaysBySeverity[severity];
  return new Date(fromMs + windowDays * DAY_MS).toISOString();
}

/** True once `report.expiresAt` has passed — i.e. nobody has reconfirmed it recently enough. */
export function isReportExpired(report: Pick<AccessibilityReport, "expiresAt">, now: Date = new Date()): boolean {
  return new Date(report.expiresAt).getTime() <= now.getTime();
}

/**
 * Whether this report should still count as an unresolved, active problem
 * right now — the check routing and "active issue" UI should use instead of
 * a raw `status === "active"`, so a six-month-old unconfirmed report stops
 * being treated as gospel.
 */
export function isEffectivelyActive(
  report: Pick<AccessibilityReport, "status" | "expiresAt">,
  now: Date = new Date()
): boolean {
  return report.status === "active" && !isReportExpired(report, now);
}

function daysSince(isoTimestamp: string, now: Date): number {
  return (now.getTime() - new Date(isoTimestamp).getTime()) / DAY_MS;
}

/**
 * Confidence badge for a report, or `null` when it shouldn't be shown at
 * all — an expired-and-unconfirmed report (we no longer have any signal
 * either way) or a report resolved too long ago to still be relevant.
 */
export function getReportConfidence(
  report: Pick<AccessibilityReport, "status" | "expiresAt" | "lastConfirmedAt" | "confirmCount" | "resolvedAt">,
  now: Date = new Date()
): AccessibilityReportConfidence | null {
  const c = ACCESSIBILITY_REPORT_CONFIG;

  if (report.status === "resolved") {
    const resolvedReference = report.resolvedAt ?? report.lastConfirmedAt;
    return daysSince(resolvedReference, now) <= c.recentConfirmationWindowDays ? "verified" : null;
  }

  if (isReportExpired(report, now)) return null;

  const recentlyConfirmed = daysSince(report.lastConfirmedAt, now) <= c.recentConfirmationWindowDays;
  if (report.confirmCount >= c.criticalConfirmThreshold && recentlyConfirmed) return "critical";
  return "community";
}

/** True when a report has any confidence badge to show (i.e. worth rendering at all). */
export function shouldDisplayReport(report: AccessibilityReport, now: Date = new Date()): boolean {
  return getReportConfidence(report, now) !== null;
}
