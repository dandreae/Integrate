import { SEEDED_ACCESSIBILITY_REPORTS } from "@/data/accessibilityReports";
import { ACCESSIBILITY_REPORT_CONFIG } from "@/constants/accessibilityReports";
import { computeExpiresAt } from "@/services/accessibility/reportConfidence";
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
  private confirmedByUser = new Set<string>(); // `${reportId}:${uid}`, "still an issue"
  private fixedByUser = new Set<string>(); // `${reportId}:${uid}`, "fixed"
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
    const now = new Date().toISOString();
    this.reports = [
      ...this.reports,
      {
        id: `mock-${Date.now()}`,
        ...payload,
        reportedAt: now,
        lastConfirmedAt: now,
        expiresAt: computeExpiresAt(now, payload.severity),
        status: "active",
        confirmCount: 0,
        fixedCount: 0,
        submittedBy: uid,
      },
    ];
    this.notify();
  }

  async confirmStillActive(reportId: string, uid: string): Promise<void> {
    const key = `${reportId}:${uid}`;
    if (this.confirmedByUser.has(key)) return; // one confirmation per user, same as live rules enforce
    this.confirmedByUser.add(key);
    const now = new Date().toISOString();
    this.reports = this.reports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            confirmCount: report.confirmCount + 1,
            lastConfirmedAt: now,
            expiresAt: computeExpiresAt(now, report.severity),
          }
        : report
    );
    this.notify();
  }

  async confirmFixed(reportId: string, uid: string): Promise<void> {
    const key = `${reportId}:${uid}`;
    if (this.fixedByUser.has(key)) return; // one "fixed" vote per user
    this.fixedByUser.add(key);
    const now = new Date().toISOString();
    this.reports = this.reports.map((report) => {
      if (report.id !== reportId) return report;
      const fixedCount = report.fixedCount + 1;
      const resolved = fixedCount >= ACCESSIBILITY_REPORT_CONFIG.fixedVoteResolveThreshold;
      return {
        ...report,
        fixedCount,
        lastConfirmedAt: now,
        ...(resolved ? { status: "resolved" as const, resolvedAt: now } : {}),
      };
    });
    this.notify();
  }

  async markResolved(reportId: string): Promise<void> {
    const now = new Date().toISOString();
    this.reports = this.reports.map((report) =>
      report.id === reportId ? { ...report, status: "resolved", resolvedAt: now } : report
    );
    this.notify();
  }
}
