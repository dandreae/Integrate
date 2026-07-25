import type { CreateReportInput } from "@/types";
import { MockReportRepository } from "../MockReportRepository";

const sampleInput: CreateReportInput = {
  issueType: "elevator-unavailable",
  relatedEntity: { type: "place", id: "lau", label: "Lauinger Library" },
  description: "The east elevator has been out for two days.",
  severity: "medium",
  expectedDuration: "Several days",
};

describe("MockReportRepository", () => {
  it("starts empty when seeded with no reports", async () => {
    const repo = new MockReportRepository([]);
    const results = await repo.getReportsForEntity("place", "lau");
    expect(results).toEqual([]);
  });

  it("creates a report and assigns id, submittedAt, verification, and lifecycle status", async () => {
    const repo = new MockReportRepository([]);
    const created = await repo.createReport(sampleInput);

    expect(created.id).toBeTruthy();
    expect(created.verificationStatus).toBe("unverified");
    expect(created.lifecycleStatus).toBe("active");
    expect(created.submittedAt).toBeTruthy();
    expect(new Date(created.submittedAt).toString()).not.toBe("Invalid Date");
    expect(created.issueType).toBe(sampleInput.issueType);
    expect(created.description).toBe(sampleInput.description);
  });

  it("derives expiresAt from expectedDuration when not explicitly provided", async () => {
    const repo = new MockReportRepository([]);
    const created = await repo.createReport(sampleInput);
    expect(created.expiresAt).toBeTruthy();
  });

  it("leaves expiresAt unset for 'Unknown' expected duration", async () => {
    const repo = new MockReportRepository([]);
    const created = await repo.createReport({ ...sampleInput, expectedDuration: "Unknown" });
    expect(created.expiresAt).toBeUndefined();
  });

  it("makes a created report retrievable via getReportsForEntity", async () => {
    const repo = new MockReportRepository([]);
    await repo.createReport(sampleInput);

    const results = await repo.getReportsForEntity("place", "lau");
    expect(results).toHaveLength(1);
    expect(results[0].description).toBe(sampleInput.description);
  });

  it("does not return reports for a different entity", async () => {
    const repo = new MockReportRepository([]);
    await repo.createReport(sampleInput);

    const results = await repo.getReportsForEntity("place", "some-other-place");
    expect(results).toHaveLength(0);
  });

  it("does not return reports for a matching id but different entity type", async () => {
    const repo = new MockReportRepository([]);
    await repo.createReport(sampleInput);

    const results = await repo.getReportsForEntity("constructionZone", "lau");
    expect(results).toHaveLength(0);
  });

  it("keeps instances isolated from each other", async () => {
    const repoA = new MockReportRepository([]);
    const repoB = new MockReportRepository([]);

    await repoA.createReport(sampleInput);

    expect(await repoA.getReportsForEntity("place", "lau")).toHaveLength(1);
    expect(await repoB.getReportsForEntity("place", "lau")).toHaveLength(0);
  });

  it("returns newest-first when multiple reports exist for the same entity", async () => {
    const repo = new MockReportRepository([]);
    const first = await repo.createReport(sampleInput);
    const second = await repo.createReport({ ...sampleInput, description: "Still broken today." });

    const results = await repo.getReportsForEntity("place", "lau");
    expect(results[0].id).toBe(second.id);
    expect(results[1].id).toBe(first.id);
  });

  it("getAllReports returns every report regardless of entity", async () => {
    const repo = new MockReportRepository([]);
    await repo.createReport(sampleInput);
    await repo.createReport({ ...sampleInput, relatedEntity: { type: "constructionZone", id: "zone-1", label: "Zone" } });

    const all = await repo.getAllReports();
    expect(all).toHaveLength(2);
  });

  it("markResolved sets lifecycleStatus to resolved and returns the updated report", async () => {
    const repo = new MockReportRepository([]);
    const created = await repo.createReport(sampleInput);

    const resolved = await repo.markResolved(created.id);
    expect(resolved?.lifecycleStatus).toBe("resolved");

    const stored = await repo.getReportsForEntity("place", "lau");
    expect(stored[0].lifecycleStatus).toBe("resolved");
  });

  it("markResolved returns undefined for an unknown report id", async () => {
    const repo = new MockReportRepository([]);
    const result = await repo.markResolved("nonexistent-id");
    expect(result).toBeUndefined();
  });

  it("clearAll empties the repository", async () => {
    const repo = new MockReportRepository([]);
    await repo.createReport(sampleInput);
    await repo.clearAll();

    expect(await repo.getAllReports()).toEqual([]);
  });
});
