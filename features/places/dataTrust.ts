import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { CampusReport, ConfidenceLevel, ReportIssueType } from "@/types";
import type { BadgeTone } from "@/components/Badge";
import { isReportActive } from "@/services/reports/reportLifecycle";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/**
 * DATA TRUST
 * ----------
 * Shared logic for the "is this data still good?" question, reused
 * everywhere verification status is shown (place detail, construction zone
 * detail, report confirmations, and — proactively — the preview card,
 * search results, route summaries, and map markers). Every indicator pairs
 * an icon and a word with its color — never color alone.
 */

export const DEFAULT_OUTDATED_THRESHOLD_DAYS = 120;

export function isDataOutdated(
  dataLastVerifiedAt: string,
  thresholdDays: number = DEFAULT_OUTDATED_THRESHOLD_DAYS,
  now: Date = new Date()
): boolean {
  const verifiedAtMs = new Date(dataLastVerifiedAt).getTime();
  if (Number.isNaN(verifiedAtMs)) return false;

  const ageDays = (now.getTime() - verifiedAtMs) / (1000 * 60 * 60 * 24);
  return ageDays > thresholdDays;
}

export interface TrustBadgeProps {
  label: string;
  icon: IoniconName;
  tone: BadgeTone;
}

export function getVerificationStatusBadge(
  dataLastVerifiedAt: string,
  thresholdDays?: number
): TrustBadgeProps {
  if (isDataOutdated(dataLastVerifiedAt, thresholdDays)) {
    return { label: "May be outdated", icon: "time-outline", tone: "warning" };
  }
  return { label: "Verified", icon: "shield-checkmark-outline", tone: "accessible" };
}

export function getConfidenceBadge(level: ConfidenceLevel): TrustBadgeProps {
  switch (level) {
    case "high":
      return { label: "High confidence", icon: "checkmark-circle-outline", tone: "accessible" };
    case "medium":
      return { label: "Medium confidence", icon: "help-circle-outline", tone: "warning" };
    case "low":
      return { label: "Low confidence", icon: "alert-circle-outline", tone: "danger" };
  }
}

export const UNVERIFIED_REPORT_BADGE: TrustBadgeProps = {
  label: "Unverified — student-reported",
  icon: "person-outline",
  tone: "neutral",
};

const ACCESSIBILITY_ISSUE_TYPES = new Set<ReportIssueType>([
  "ramp-blocked",
  "elevator-unavailable",
  "entrance-locked",
  "accessibility-issue",
]);

/** Whether any currently-active report among `reports` concerns accessibility. */
export function hasActiveAccessibilityReport(reports: CampusReport[], now: Date = new Date()): boolean {
  return reports.some((report) => ACCESSIBILITY_ISSUE_TYPES.has(report.issueType) && isReportActive(report, now));
}

export type TrustSignalKind = "outdated" | "lowConfidenceEntrance" | "unverifiedReport";

export interface TrustSignal extends TrustBadgeProps {
  kind: TrustSignalKind;
  /** Answers: what's uncertain, when it was last verified, what kind of source it is, what to do next. Shown when the indicator is tapped. */
  explanation: string;
}

export interface TrustSignalSource {
  dataLastVerifiedAt: string;
  verificationSource: string;
  confidenceLevel?: ConfidenceLevel;
}

export interface TrustSignalOptions {
  thresholdDays?: number;
  now?: Date;
}

/**
 * Composes the set of actionable trust signals for a place — zero, one, or
 * several. An empty array means "nothing to flag," which callers use to
 * decide whether to show any indicator at all (never one on every marker).
 */
export function getPlaceTrustSignals(
  source: TrustSignalSource,
  hasAccessibilityReport: boolean,
  options?: TrustSignalOptions
): TrustSignal[] {
  const signals: TrustSignal[] = [];

  if (isDataOutdated(source.dataLastVerifiedAt, options?.thresholdDays, options?.now)) {
    signals.push({
      kind: "outdated",
      label: "Accessibility info may be outdated",
      icon: "time-outline",
      tone: "warning",
      explanation:
        `This place's accessibility details haven't been reverified since ${source.dataLastVerifiedAt} ` +
        `(source: ${source.verificationSource}). Entrances, ramps, or hours may have changed since then — ` +
        `check current signage when you arrive, or report an update if something's wrong.`,
    });
  }

  if (source.confidenceLevel === "low") {
    signals.push({
      kind: "lowConfidenceEntrance",
      label: "Entrance data is low confidence",
      icon: "help-circle-outline",
      tone: "warning",
      explanation:
        `Entrance details for this place come from limited or student-submitted information ` +
        `(source: ${source.verificationSource}), not an official facilities survey. Treat entrance ` +
        `locations as approximate and allow extra time.`,
    });
  }

  if (hasAccessibilityReport) {
    signals.push({
      kind: "unverifiedReport",
      label: "Unverified accessibility report",
      icon: "alert-circle-outline",
      tone: "danger",
      explanation:
        "A student recently reported an accessibility issue here — for example a blocked ramp or a " +
        "locked entrance. Campus staff haven't confirmed it yet, but it's worth checking before you go.",
    });
  }

  return signals;
}
