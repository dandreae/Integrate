export type AccessibilityIssueType =
  | "elevator-out"
  | "ramp-blocked"
  | "entrance-inaccessible"
  | "path-obstruction"
  | "other";

export type AccessibilityReportStatus = "active" | "resolved";

export interface AccessibilityReport {
  id: string;
  placeId: string;
  /** Set when the report is specific to one entrance rather than the place in general. */
  entranceId?: string;
  issueType: AccessibilityIssueType;
  description: string;
  /** ISO timestamp. */
  reportedAt: string;
  status: AccessibilityReportStatus;
  /** How many other students have confirmed this is still an issue. */
  confirmCount: number;
  /** Present on live (Firestore) reports; absent on seeded demo data. */
  submittedBy?: string;
}

export interface NewAccessibilityReportPayload {
  placeId: string;
  entranceId?: string;
  issueType: AccessibilityIssueType;
  description: string;
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
