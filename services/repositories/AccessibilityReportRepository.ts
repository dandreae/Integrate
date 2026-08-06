import type { AccessibilityReport, NewAccessibilityReportPayload } from "@/types";

export interface AccessibilityReportRepository {
  /** Live-updating list of all reports (active + resolved) for the campus. Returns an unsubscribe function. */
  subscribe(onChange: (reports: AccessibilityReport[]) => void): () => void;
  submitReport(uid: string, payload: NewAccessibilityReportPayload): Promise<void>;
  /** "Still an issue" confirmation — one per user, enforced by the implementation. */
  confirmStillActive(reportId: string, uid: string): Promise<void>;
  markResolved(reportId: string): Promise<void>;
}
