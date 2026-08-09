export type AccessibilityIssueType =
  | "elevator-out"
  | "ramp-blocked"
  | "entrance-inaccessible"
  | "path-obstruction"
  | "other";

export type AccessibilityReportStatus = "active" | "resolved";

/** How disruptive the issue is — drives how long it stays flagged without reconfirmation. */
export type AccessibilityReportSeverity = "low" | "medium" | "high";

/**
 * How much a viewer should trust the currently displayed status. Computed
 * client-side (see services/accessibility/reportConfidence.ts) from
 * confirmCount/lastConfirmedAt/expiresAt — never stored, since it changes
 * with the passage of time alone, not just writes.
 */
export type AccessibilityReportConfidence = "critical" | "community" | "verified";

export interface AccessibilityReport {
  id: string;
  placeId: string;
  /** Set when the report is specific to one entrance rather than the place in general. */
  entranceId?: string;
  issueType: AccessibilityIssueType;
  description: string;
  severity: AccessibilityReportSeverity;
  /** ISO timestamp the report was originally submitted. */
  reportedAt: string;
  /** ISO timestamp of the most recent "still an issue" or "fixed" confirmation. Starts equal to `reportedAt`. */
  lastConfirmedAt: string;
  /**
   * ISO timestamp after which this report is no longer treated as active
   * (routing/UI) absent a fresh confirmation. Recomputed from `severity` and
   * pushed forward every time `lastConfirmedAt` advances — a report that
   * keeps getting reconfirmed never goes stale; one nobody revisits does.
   */
  expiresAt: string;
  status: AccessibilityReportStatus;
  /** How many other students have confirmed this is still an issue. */
  confirmCount: number;
  /** How many other students have confirmed this was fixed. */
  fixedCount: number;
  /** Present on live (Firestore) reports; absent on seeded demo data. */
  submittedBy?: string;
  /** ISO timestamp the report was resolved, when known. */
  resolvedAt?: string;
}

export interface NewAccessibilityReportPayload {
  placeId: string;
  entranceId?: string;
  issueType: AccessibilityIssueType;
  description: string;
  severity: AccessibilityReportSeverity;
}

export const ACCESSIBILITY_ISSUE_META: Record<
  AccessibilityIssueType,
  { label: string; icon: "flash-off-outline" | "trail-sign-outline" | "close-circle-outline" | "warning-outline" | "alert-circle-outline" }
> = {
  "elevator-out": { label: "Elevator out of service", icon: "flash-off-outline" },
  "ramp-blocked": { label: "Ramp blocked", icon: "trail-sign-outline" },
  "entrance-inaccessible": { label: "Entrance not accessible", icon: "close-circle-outline" },
  "path-obstruction": { label: "Path obstruction", icon: "warning-outline" },
  other: { label: "Other accessibility issue", icon: "alert-circle-outline" },
};
