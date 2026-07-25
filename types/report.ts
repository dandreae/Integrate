import type { LatLng } from "./construction";

export type ReportIssueType =
  | "path-closed"
  | "construction"
  | "elevator-unavailable"
  | "ramp-blocked"
  | "entrance-locked"
  | "incorrect-info"
  | "accessibility-issue"
  | "other";

export type ReportSeverity = "low" | "medium" | "high";

/**
 * Whether campus staff have reviewed this report. There is no moderation
 * workflow or auth in the app yet, so every report is "unverified" today —
 * this type exists so a future review flow can extend it without a
 * breaking rename.
 */
export type ReportVerificationStatus = "unverified";

/**
 * Whether a report is still operationally relevant — independent of
 * verification. An unverified report can still be "active"; this is what
 * route evaluation and the dev "mark resolved" tool operate on.
 */
export type ReportLifecycleStatus = "active" | "resolved" | "expired";

export type ReportRelatedEntityType = "place" | "entrance" | "constructionZone" | "routeSegment" | "general";

export interface ReportRelatedEntity {
  type: ReportRelatedEntityType;
  /** Stable identifier (place id, entrance id, construction zone id, route id) — not just a display label. */
  id: string;
  /** Display label captured at submission time so reports stay readable even if the underlying record changes. */
  label: string;
}

export type ExpectedDurationOption = "Less than 1 hour" | "Today" | "Several days" | "Unknown";

export interface CampusReport {
  id: string;
  issueType: ReportIssueType;
  relatedEntity: ReportRelatedEntity;
  description: string;
  severity?: ReportSeverity;
  expectedDuration?: ExpectedDurationOption;
  submittedAt: string;
  verificationStatus: ReportVerificationStatus;
  lifecycleStatus: ReportLifecycleStatus;
  /** Derived from `expectedDuration` at submission time, when that conversion is meaningful (not "Unknown"). */
  expiresAt?: string;
  /** Geographic footprint of the reported condition, for proximity-based route evaluation. */
  coordinates?: LatLng;
  affectedRadiusMeters?: number;
}

export type CreateReportInput = Omit<CampusReport, "id" | "submittedAt" | "verificationStatus" | "lifecycleStatus">;
