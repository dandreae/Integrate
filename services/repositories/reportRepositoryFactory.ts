import { INITIAL_REPORTS } from "@/data";
import { AsyncStorageReportRepository } from "./AsyncStorageReportRepository";
import { MockReportRepository } from "./mock/MockReportRepository";
import type { ReportRepository } from "./ReportRepository";

export type ReportRepositoryKind = "asyncStorage" | "mock";

/**
 * Dependency-provider seam for report persistence. The app uses the
 * AsyncStorage-backed implementation by default; tests can request the
 * in-memory mock explicitly. Swapping in a Supabase-backed implementation
 * later is a one-line change here — nothing else in the app depends on
 * which implementation is active, only on the `ReportRepository` interface.
 */
export function createReportRepository(kind: ReportRepositoryKind = "asyncStorage"): ReportRepository {
  switch (kind) {
    case "mock":
      return new MockReportRepository();
    case "asyncStorage":
    default:
      return new AsyncStorageReportRepository(INITIAL_REPORTS);
  }
}
