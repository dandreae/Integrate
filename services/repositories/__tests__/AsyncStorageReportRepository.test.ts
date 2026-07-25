import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CreateReportInput } from "@/types";
import { AsyncStorageReportRepository } from "../AsyncStorageReportRepository";

const sampleInput: CreateReportInput = {
  issueType: "ramp-blocked",
  relatedEntity: { type: "entrance", id: "healy-side", label: "Healy Hall — Side entrance" },
  description: "Scaffolding is blocking the ramp.",
  severity: "high",
  expectedDuration: "Today",
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("AsyncStorageReportRepository — save and reload", () => {
  it("persists a created report so a new repository instance can read it back", async () => {
    const repoA = new AsyncStorageReportRepository();
    const created = await repoA.createReport(sampleInput);

    // Simulates an app restart: a fresh instance, no shared in-memory state.
    const repoB = new AsyncStorageReportRepository();
    const results = await repoB.getReportsForEntity("entrance", "healy-side");

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(created.id);
    expect(results[0].description).toBe(sampleInput.description);
  });

  it("persists multiple reports across instances, newest first", async () => {
    const repoA = new AsyncStorageReportRepository();
    const first = await repoA.createReport(sampleInput);
    const second = await repoA.createReport({ ...sampleInput, description: "Still blocked." });

    const repoB = new AsyncStorageReportRepository();
    const all = await repoB.getAllReports();

    expect(all).toHaveLength(2);
    expect(all[0].id).toBe(second.id);
    expect(all[1].id).toBe(first.id);
  });
});

describe("AsyncStorageReportRepository — corrupted or unexpected data", () => {
  it("falls back to an empty list when stored data is not valid JSON", async () => {
    await AsyncStorage.setItem("integrate.reports", "{not valid json!!");

    const repo = new AsyncStorageReportRepository();
    const results = await repo.getAllReports();

    expect(results).toEqual([]);
  });

  it("falls back to an empty list when the stored value isn't an envelope object", async () => {
    await AsyncStorage.setItem("integrate.reports", JSON.stringify(["just", "an", "array"]));

    const repo = new AsyncStorageReportRepository();
    expect(await repo.getAllReports()).toEqual([]);
  });

  it("drops individual reports missing required fields but keeps valid ones", async () => {
    await AsyncStorage.setItem(
      "integrate.reports",
      JSON.stringify({
        schemaVersion: 1,
        reports: [
          { id: "good-1", issueType: "other", relatedEntity: { type: "general", id: "x", label: "X" }, description: "ok", submittedAt: "2026-01-01T00:00:00.000Z" },
          { id: "missing-issueType", relatedEntity: { type: "general", id: "x", label: "X" }, description: "ok", submittedAt: "2026-01-01T00:00:00.000Z" },
          { issueType: "other", relatedEntity: { type: "general", id: "x", label: "X" }, description: "no id at all", submittedAt: "2026-01-01T00:00:00.000Z" },
          { id: "bad-entity-type", issueType: "other", relatedEntity: { type: "not-a-real-type", id: "x", label: "X" }, description: "ok", submittedAt: "2026-01-01T00:00:00.000Z" },
          "not even an object",
        ],
      })
    );

    const repo = new AsyncStorageReportRepository();
    const results = await repo.getAllReports();

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("good-1");
  });

  it("fills in safe defaults for recoverable gaps (missing lifecycleStatus, severity)", async () => {
    await AsyncStorage.setItem(
      "integrate.reports",
      JSON.stringify({
        schemaVersion: 1,
        reports: [
          {
            id: "partial-1",
            issueType: "other",
            relatedEntity: { type: "general", id: "x", label: "X" },
            description: "ok",
            submittedAt: "2026-01-01T00:00:00.000Z",
            // no severity, no lifecycleStatus, no expiresAt
          },
        ],
      })
    );

    const repo = new AsyncStorageReportRepository();
    const results = await repo.getAllReports();

    expect(results).toHaveLength(1);
    expect(results[0].severity).toBeUndefined();
    expect(results[0].lifecycleStatus).toBe("active");
    expect(results[0].verificationStatus).toBe("unverified");
  });

  it("handles an unrecognized/future schema version without crashing", async () => {
    await AsyncStorage.setItem(
      "integrate.reports",
      JSON.stringify({
        schemaVersion: 999,
        reports: [
          {
            id: "future-1",
            issueType: "other",
            relatedEntity: { type: "general", id: "x", label: "X" },
            description: "ok",
            submittedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      })
    );

    const repo = new AsyncStorageReportRepository();
    const results = await repo.getAllReports();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("future-1");
  });

  it("treats an empty AsyncStorage as no reports, not an error", async () => {
    const repo = new AsyncStorageReportRepository();
    expect(await repo.getAllReports()).toEqual([]);
  });
});

describe("AsyncStorageReportRepository — first-launch seeding", () => {
  const seed = [
    {
      id: "seed-1",
      issueType: "other" as const,
      relatedEntity: { type: "general" as const, id: "x", label: "X" },
      description: "Seed report",
      submittedAt: "2026-01-01T00:00:00.000Z",
      verificationStatus: "unverified" as const,
      lifecycleStatus: "active" as const,
    },
  ];

  it("seeds from the provided defaults only on a true first launch", async () => {
    const repo = new AsyncStorageReportRepository(seed);
    const results = await repo.getAllReports();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("seed-1");
  });

  it("does not re-seed once storage has been explicitly cleared", async () => {
    const repoA = new AsyncStorageReportRepository(seed);
    await repoA.getAllReports(); // triggers the first-launch seed write
    await repoA.clearAll();

    const repoB = new AsyncStorageReportRepository(seed);
    expect(await repoB.getAllReports()).toEqual([]);
  });

  it("keeps the seed alongside a report submitted on that same first launch", async () => {
    const repoA = new AsyncStorageReportRepository(seed);
    const created = await repoA.createReport(sampleInput);

    const repoB = new AsyncStorageReportRepository(seed);
    const results = await repoB.getAllReports();
    expect(results.some((r) => r.id === "seed-1")).toBe(true);
    expect(results.some((r) => r.id === created.id)).toBe(true);
  });
});

describe("AsyncStorageReportRepository — clear/reset behavior", () => {
  it("clearAll empties storage, and a subsequent instance also sees it empty", async () => {
    const repoA = new AsyncStorageReportRepository();
    await repoA.createReport(sampleInput);
    await repoA.clearAll();

    const repoB = new AsyncStorageReportRepository();
    expect(await repoB.getAllReports()).toEqual([]);
  });

  it("markResolved persists across instances", async () => {
    const repoA = new AsyncStorageReportRepository();
    const created = await repoA.createReport(sampleInput);
    await repoA.markResolved(created.id);

    const repoB = new AsyncStorageReportRepository();
    const all = await repoB.getAllReports();
    expect(all[0].lifecycleStatus).toBe("resolved");
  });
});
