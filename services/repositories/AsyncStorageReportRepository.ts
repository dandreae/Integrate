import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  CampusReport,
  CreateReportInput,
  ExpectedDurationOption,
  ReportIssueType,
  ReportRelatedEntityType,
  ReportSeverity,
} from "@/types";
import { REPORT_ISSUE_TYPES, REPORT_RELATED_ENTITY_TYPES, REPORT_SEVERITIES } from "@/features/reports/reportMeta";
import { expectedDurationToExpiresAt, EXPECTED_DURATION_OPTIONS } from "@/services/reports/reportLifecycle";
import type { ReportRepository } from "./ReportRepository";

/**
 * ASYNC STORAGE REPORT REPOSITORY
 * -------------------------------
 * Persists reports on-device so they survive an app restart. Storage
 * schema is versioned via an envelope (`{ schemaVersion, reports }`) rather
 * than trusting a bare array, so a future field change has a clear
 * migration boundary instead of silently breaking old installs.
 *
 * Reads are defensive at every layer: malformed JSON, an unexpected shape,
 * or a single corrupted report record all degrade gracefully (skip the bad
 * record, or fall back to an empty list) rather than crashing the app.
 */

const STORAGE_KEY = "integrate.reports";
const CURRENT_SCHEMA_VERSION = 1;

interface ReportsEnvelopeV1 {
  schemaVersion: 1;
  reports: unknown[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function sanitizeSeverity(value: unknown): ReportSeverity | undefined {
  return typeof value === "string" && REPORT_SEVERITIES.includes(value as ReportSeverity)
    ? (value as ReportSeverity)
    : undefined;
}

function sanitizeExpectedDuration(value: unknown): ExpectedDurationOption | undefined {
  return typeof value === "string" && EXPECTED_DURATION_OPTIONS.includes(value as ExpectedDurationOption)
    ? (value as ExpectedDurationOption)
    : undefined;
}

function sanitizeCoordinates(value: unknown): CampusReport["coordinates"] {
  if (!isPlainObject(value)) return undefined;
  const { latitude, longitude } = value;
  if (typeof latitude !== "number" || typeof longitude !== "number") return undefined;
  return { latitude, longitude };
}

/**
 * Validates and repairs a single raw stored report. Returns null when the
 * record is fundamentally unusable (missing an id, an unrecognized issue
 * type, no related entity) — recoverable gaps (missing severity, a stale
 * lifecycle field) get sane defaults instead of rejecting the whole record.
 */
function sanitizeReport(raw: unknown): CampusReport | null {
  if (!isPlainObject(raw)) return null;

  const { id, issueType, relatedEntity, description, submittedAt } = raw;
  if (typeof id !== "string" || !id) return null;
  if (typeof issueType !== "string" || !REPORT_ISSUE_TYPES.includes(issueType as ReportIssueType)) return null;
  if (!isPlainObject(relatedEntity)) return null;
  if (typeof description !== "string") return null;
  if (!isValidIsoDate(submittedAt)) return null;

  const entityType = relatedEntity.type;
  const entityId = relatedEntity.id;
  const entityLabel = relatedEntity.label;
  if (
    typeof entityType !== "string" ||
    !REPORT_RELATED_ENTITY_TYPES.includes(entityType as ReportRelatedEntityType)
  ) {
    return null;
  }
  if (typeof entityId !== "string" || !entityId) return null;

  const lifecycleStatus =
    raw.lifecycleStatus === "resolved" || raw.lifecycleStatus === "expired" || raw.lifecycleStatus === "active"
      ? raw.lifecycleStatus
      : "active";

  return {
    id,
    issueType: issueType as ReportIssueType,
    relatedEntity: {
      type: entityType as ReportRelatedEntityType,
      id: entityId,
      label: typeof entityLabel === "string" ? entityLabel : "Unknown",
    },
    description,
    severity: sanitizeSeverity(raw.severity),
    expectedDuration: sanitizeExpectedDuration(raw.expectedDuration),
    submittedAt,
    verificationStatus: "unverified",
    lifecycleStatus,
    expiresAt: isValidIsoDate(raw.expiresAt) ? (raw.expiresAt as string) : undefined,
    coordinates: sanitizeCoordinates(raw.coordinates),
    affectedRadiusMeters: typeof raw.affectedRadiusMeters === "number" ? raw.affectedRadiusMeters : undefined,
  };
}

/**
 * Migration boundary: dispatches on the envelope's schema version. Only
 * v1 exists today, but the switch (rather than assuming the current shape)
 * is the seam a v2 migration would extend — e.g. `case 2: return migrateV1ToV2(...)`.
 */
function migrateEnvelope(parsed: unknown): CampusReport[] {
  if (!isPlainObject(parsed) || !Array.isArray(parsed.reports)) {
    return [];
  }

  switch (parsed.schemaVersion) {
    case 1:
    default: {
      const reports = parsed.reports;
      return reports
        .map(sanitizeReport)
        .filter((report): report is CampusReport => report !== null);
    }
  }
}

export class AsyncStorageReportRepository implements ReportRepository {
  private cache: CampusReport[] | null = null;
  private pendingLoad: Promise<CampusReport[]> | null = null;

  /**
   * @param seedIfNeverWritten Written once, only on a true first launch
   * (storage key has literally never been set) — not on an empty list from
   * `clearAll()`, which writes an explicit empty envelope and must stay
   * empty. Lets the real app start pre-populated with demo reports while
   * tests (which pass no seed) get a predictable empty start.
   */
  constructor(private seedIfNeverWritten: CampusReport[] = []) {}

  private async load(): Promise<CampusReport[]> {
    if (this.cache) return this.cache;
    if (!this.pendingLoad) {
      this.pendingLoad = this.readFromStorage();
    }
    this.cache = await this.pendingLoad;
    return this.cache;
  }

  private async readFromStorage(): Promise<CampusReport[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);

      if (raw === null) {
        if (this.seedIfNeverWritten.length > 0) {
          await this.persist([...this.seedIfNeverWritten]);
        }
        return [...this.seedIfNeverWritten];
      }

      const parsed: unknown = JSON.parse(raw);
      return migrateEnvelope(parsed);
    } catch {
      // Corrupted JSON, or AsyncStorage itself failing — fail safe rather
      // than crash the app on a broken read.
      return [];
    }
  }

  private async persist(reports: CampusReport[]): Promise<void> {
    this.cache = reports;
    const envelope: ReportsEnvelopeV1 = { schemaVersion: CURRENT_SCHEMA_VERSION, reports };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  }

  async createReport(input: CreateReportInput): Promise<CampusReport> {
    const reports = await this.load();
    const submittedAt = new Date();

    const report: CampusReport = {
      ...input,
      id: `report-${submittedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      submittedAt: submittedAt.toISOString(),
      verificationStatus: "unverified",
      lifecycleStatus: "active",
      expiresAt:
        input.expiresAt ??
        (input.expectedDuration ? expectedDurationToExpiresAt(input.expectedDuration, submittedAt) : undefined),
    };

    await this.persist([report, ...reports]);
    return report;
  }

  async getReportsForEntity(
    entityType: CampusReport["relatedEntity"]["type"],
    entityId: string
  ): Promise<CampusReport[]> {
    const reports = await this.load();
    return reports.filter(
      (report) => report.relatedEntity.type === entityType && report.relatedEntity.id === entityId
    );
  }

  async getAllReports(): Promise<CampusReport[]> {
    return [...(await this.load())];
  }

  async markResolved(reportId: string): Promise<CampusReport | undefined> {
    const reports = await this.load();
    let resolved: CampusReport | undefined;

    const next = reports.map((report) => {
      if (report.id !== reportId) return report;
      resolved = { ...report, lifecycleStatus: "resolved" as const };
      return resolved;
    });

    if (resolved) {
      await this.persist(next);
    }
    return resolved;
  }

  async clearAll(): Promise<void> {
    await this.persist([]);
  }
}
