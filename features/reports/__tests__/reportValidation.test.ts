import { validateReportDraft, type ReportDraft } from "../reportValidation";

const validRelatedEntity = { type: "place" as const, id: "lau", label: "Lauinger Library" };

function makeDraft(overrides: Partial<ReportDraft> = {}): ReportDraft {
  return {
    issueType: "incorrect-info",
    relatedEntity: validRelatedEntity,
    description: "The hours listed are wrong on weekends.",
    ...overrides,
  };
}

describe("validateReportDraft", () => {
  it("accepts a fully filled-out draft", () => {
    const result = validateReportDraft(makeDraft());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("requires an issue type", () => {
    const result = validateReportDraft(makeDraft({ issueType: null }));
    expect(result.valid).toBe(false);
    expect(result.errors.issueType).toBeTruthy();
  });

  it("requires a related entity", () => {
    const result = validateReportDraft(makeDraft({ relatedEntity: null }));
    expect(result.valid).toBe(false);
    expect(result.errors.relatedEntity).toBeTruthy();
  });

  it("rejects an empty description", () => {
    const result = validateReportDraft(makeDraft({ description: "" }));
    expect(result.valid).toBe(false);
    expect(result.errors.description).toBeTruthy();
  });

  it("rejects a description that is only whitespace", () => {
    const result = validateReportDraft(makeDraft({ description: "   " }));
    expect(result.valid).toBe(false);
  });

  it("rejects a description that is too short", () => {
    const result = validateReportDraft(makeDraft({ description: "hi" }));
    expect(result.valid).toBe(false);
  });

  it("does not require optional severity or expectedDuration", () => {
    const result = validateReportDraft(makeDraft({ severity: undefined, expectedDuration: undefined }));
    expect(result.valid).toBe(true);
  });

  it("reports multiple errors at once", () => {
    const result = validateReportDraft(makeDraft({ issueType: null, relatedEntity: null, description: "" }));
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors)).toEqual(
      expect.arrayContaining(["issueType", "relatedEntity", "description"])
    );
  });
});
