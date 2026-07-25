import type { CampusReport, CreateReportInput, ReportRelatedEntityType } from "@/types";

/**
 * Campus condition reports (student-submitted, always unverified on
 * creation). The mock implementation keeps reports in memory for tests; the
 * AsyncStorage-backed implementation persists them on-device. A future
 * Supabase-backed implementation can satisfy this same interface without
 * any calling code changing — see `reportRepositoryFactory`.
 */
export interface ReportRepository {
  createReport(input: CreateReportInput): Promise<CampusReport>;
  getReportsForEntity(entityType: ReportRelatedEntityType, entityId: string): Promise<CampusReport[]>;
  /** All reports, regardless of entity — used by route evaluation, which needs a broad candidate set rather than one entity's reports. */
  getAllReports(): Promise<CampusReport[]>;
  markResolved(reportId: string): Promise<CampusReport | undefined>;
  /** Development/testing only — wipes all persisted reports. Not exposed as a polished production feature. */
  clearAll(): Promise<void>;
}
