import type { ReportSeverity } from "@/types";

const SEVERITY_RANK: Record<ReportSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** Numeric rank for sorting — higher is more severe. An unset severity ranks lowest. */
export function severityRank(severity: ReportSeverity | undefined): number {
  return severity ? SEVERITY_RANK[severity] : 0;
}

/** Comparator for `Array.sort` — most severe first. */
export function compareSeverityDescending(
  a: ReportSeverity | undefined,
  b: ReportSeverity | undefined
): number {
  return severityRank(b) - severityRank(a);
}
