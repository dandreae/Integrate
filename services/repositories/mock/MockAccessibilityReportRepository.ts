import { SEEDED_ACCESSIBILITY_REPORTS } from "@/data/accessibilityReports";
import type { AccessibilityReport, NewAccessibilityReportPayload } from "@/types";
import type { AccessibilityReportRepository } from "../AccessibilityReportRepository";

/**
 * Offline/demo mode: seeded from data/accessibilityReports.ts, mutated
 * in-memory for the session (submissions/confirmations don't persist across
 * app restarts — that's the point, it's a safe sandbox for a demo). Swap to
 * MODE=live for the real Firestore-backed repository.
 */
export class MockAccessibilityReportRepository implements AccessibilityReportRepository {
  private reports: AccessibilityReport[] = [...SEEDED_ACCESSIBILITY_REPORTS];
  private confirmedByUser = new Set<string>(); // `${reportId}:${uid}`
  private listeners = new Set<(reports: AccessibilityReport[]) => void>();

  private notify() {
    const snapshot = [...this.reports];
    this.listeners.forEach((listener) => listener(snapshot));
  }

  subscribe(onChange: (reports: AccessibilityReport[]) => void): () => void {
    this.listeners.add(onChange);
    onChange([...this.reports]);
    return () => this.listeners.delete(onChange);
  }

  async submitReport(uid: string, payload: NewAccessibilityReportPayload): Promise<void> {
    this.reports = [
      ...this.reports,
      {
        id: `mock-${Date.now()}`,
        ...payload,
        reportedAt: new Date().toISOString(),
        status: "active",
        confirmCount: 0,
        submittedBy: uid,
      },
    ];
    this.notify();
  }

  async confirmStillActive(reportId: string, uid: string): Promise<void> {
    const key = `${reportId}:${uid}`;
    if (this.confirmedByUser.has(key)) return; // one confirmation per user, same as live rules enforce
    this.confirmedByUser.add(key);
    this.reports = this.reports.map((report) =>
      report.id === reportId ? { ...report, confirmCount: report.confirmCount + 1 } : report
    );
    this.notify();
  }

  async markResolved(reportId: string): Promise<void> {
    this.reports = this.reports.map((report) =>
      report.id === reportId ? { ...report, status: "resolved" } : report
    );
    this.notify();
  }
}
