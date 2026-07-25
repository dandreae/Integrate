import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { ExpectedDurationOption, ReportIssueType, ReportRelatedEntityType, ReportSeverity } from "@/types";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface ReportMeta {
  label: string;
  icon: IoniconName;
}

export const REPORT_ISSUE_TYPE_META: Record<ReportIssueType, ReportMeta> = {
  "path-closed": { label: "Path closed", icon: "close-circle-outline" },
  construction: { label: "Construction", icon: "construct-outline" },
  "elevator-unavailable": { label: "Elevator unavailable", icon: "swap-vertical-outline" },
  "ramp-blocked": { label: "Ramp blocked", icon: "trending-up-outline" },
  "entrance-locked": { label: "Entrance locked", icon: "lock-closed-outline" },
  "incorrect-info": { label: "Incorrect place information", icon: "information-circle-outline" },
  "accessibility-issue": { label: "Accessibility issue", icon: "accessibility-outline" },
  other: { label: "Other", icon: "ellipsis-horizontal-circle-outline" },
};

export const REPORT_ISSUE_TYPES: ReportIssueType[] = [
  "path-closed",
  "construction",
  "elevator-unavailable",
  "ramp-blocked",
  "entrance-locked",
  "incorrect-info",
  "accessibility-issue",
  "other",
];

export const REPORT_RELATED_ENTITY_TYPES: ReportRelatedEntityType[] = [
  "place",
  "entrance",
  "constructionZone",
  "routeSegment",
  "general",
];

export const REPORT_SEVERITY_META: Record<ReportSeverity, ReportMeta> = {
  low: { label: "Low", icon: "information-circle-outline" },
  medium: { label: "Medium", icon: "alert-circle-outline" },
  high: { label: "High", icon: "warning-outline" },
};

export const REPORT_SEVERITIES: ReportSeverity[] = ["low", "medium", "high"];

export const EXPECTED_DURATION_META: Record<ExpectedDurationOption, ReportMeta> = {
  "Less than 1 hour": { label: "Less than 1 hour", icon: "hourglass-outline" },
  Today: { label: "Today", icon: "sunny-outline" },
  "Several days": { label: "Several days", icon: "calendar-outline" },
  Unknown: { label: "Unknown", icon: "help-circle-outline" },
};
