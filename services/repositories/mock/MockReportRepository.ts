import type { CampusReport, CreateReportInput, ReportRelatedEntityType } from "@/types";
import { INITIAL_REPORTS } from "@/data";
import { expectedDurationToExpiresAt } from "@/services/reports/reportLifecycle";
import type { ReportRepository } from "../ReportRepository";

/**
 * In-memory only — used by tests (and as a lightweight fallback) rather
 * than the running app, which uses `AsyncStorageReportRepository` via
 * `reportRepositoryFactory` so reports survive a restart.
 */
export class MockReportRepository implements ReportRepository {
  private reports: CampusReport[];
  private nextSequence: number;

  constructor(seed: CampusReport[] = INITIAL_REPORTS) {
    this.reports = [...seed];
    this.nextSequence = seed.length + 1;
  }

  async createReport(input: CreateReportInput): Promise<CampusReport> {
    const submittedAt = new Date();
    const report: CampusReport = {
      ...input,
      id: `report-${Date.now()}-${this.nextSequence++}`,
      submittedAt: submittedAt.toISOString(),
      verificationStatus: "unverified",
      lifecycleStatus: "active",
      expiresAt: input.expiresAt ?? (input.expectedDuration ? expectedDurationToExpiresAt(input.expectedDuration, submittedAt) : undefined),
    };
    this.reports = [report, ...this.reports];
    return report;
  }

  async getReportsForEntity(entityType: ReportRelatedEntityType, entityId: string): Promise<CampusReport[]> {
    return this.reports.filter(
      (report) => report.relatedEntity.type === entityType && report.relatedEntity.id === entityId
    );
  }

  async getAllReports(): Promise<CampusReport[]> {
    return [...this.reports];
  }

  async markResolved(reportId: string): Promise<CampusReport | undefined> {
    let resolved: CampusReport | undefined;
    this.reports = this.reports.map((report) => {
      if (report.id !== reportId) return report;
      resolved = { ...report, lifecycleStatus: "resolved" };
      return resolved;
    });
    return resolved;
  }

  async clearAll(): Promise<void> {
    this.reports = [];
  }
}
