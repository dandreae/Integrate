import type { CreateReportInput } from "@/types";

export interface ReportDraft {
  issueType: CreateReportInput["issueType"] | null;
  relatedEntity: CreateReportInput["relatedEntity"] | null;
  description: string;
  severity?: CreateReportInput["severity"];
  expectedDuration?: string;
}

export type ReportDraftField = "issueType" | "relatedEntity" | "description";

export interface ReportValidationResult {
  valid: boolean;
  errors: Partial<Record<ReportDraftField, string>>;
}

const MIN_DESCRIPTION_LENGTH = 3;

/**
 * Pure validation for the report form — shared by the UI (to show inline
 * errors) and tests, so the rule set only lives in one place.
 */
export function validateReportDraft(draft: ReportDraft): ReportValidationResult {
  const errors: ReportValidationResult["errors"] = {};

  if (!draft.issueType) {
    errors.issueType = "Choose an issue type.";
  }

  if (!draft.relatedEntity) {
    errors.relatedEntity = "This report needs to be linked to a place, route, or construction zone.";
  }

  if (draft.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    errors.description = `Add a short description (at least ${MIN_DESCRIPTION_LENGTH} characters).`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
