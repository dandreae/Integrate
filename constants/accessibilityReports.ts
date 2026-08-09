import type { AccessibilityReportSeverity } from "@/types";

/**
 * Tuning knobs for accessibility report freshness/confidence. See
 * services/accessibility/reportConfidence.ts for how these are applied.
 */
export const ACCESSIBILITY_REPORT_CONFIG = {
  /**
   * How many days a report stays "active" without a fresh confirmation,
   * before it's treated as expired (no longer shown, no longer penalizes
   * routing). Higher-severity issues (a genuinely inaccessible entrance, an
   * out-of-service elevator) are institutional/facilities problems that
   * plausibly stay broken for a couple weeks; low-severity ones (a stray
   * obstruction) are more likely transient, so they expire fast absent
   * reconfirmation.
   */
  expirationDaysBySeverity: {
    low: 3,
    medium: 7,
    high: 14,
  } satisfies Record<AccessibilityReportSeverity, number>,

  /**
   * A report needs a confirmation within this many days to count as
   * "recently verified" — used both for the 🔴 critical tier (multiple
   * *recent* confirmations) and the 🟢 verified tier (recently resolved).
   * Deliberately shorter than any expiration window above: confirmCount can
   * stay high forever, but staleness should downgrade the badge well before
   * the report actually expires.
   */
  recentConfirmationWindowDays: 3,

  /** confirmCount at/above which an active, recently-confirmed report is "critical" (🔴) rather than "community" (🟡). */
  criticalConfirmThreshold: 3,

  /** fixedCount at/above which a report auto-resolves from community "Fixed" votes alone. */
  fixedVoteResolveThreshold: 2,
} as const;
