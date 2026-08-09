import { beforeEach, describe, expect, it } from "vitest";
import { MockAccessibilityReportRepository } from "../MockAccessibilityReportRepository";

describe("MockAccessibilityReportRepository", () => {
  let repo: MockAccessibilityReportRepository;

  beforeEach(() => {
    repo = new MockAccessibilityReportRepository();
  });

  it("is seeded with demo data on construction", () => {
    const received: unknown[] = [];
    repo.subscribe((reports) => received.push(reports));
    expect(received).toHaveLength(1);
    expect((received[0] as unknown[]).length).toBeGreaterThan(0);
  });

  it("notifies subscribers when a report is submitted", async () => {
    const snapshots: number[] = [];
    repo.subscribe((reports) => snapshots.push(reports.length));

    await repo.submitReport("user-1", {
      placeId: "lauinger-library",
      issueType: "path-obstruction",
      description: "Test obstruction",
      severity: "medium",
    });

    expect(snapshots.length).toBeGreaterThanOrEqual(2);
    expect(snapshots.at(-1)).toBe(snapshots[0] + 1);
  });

  it("confirmStillActive increments confirmCount once per user, ignoring repeats", async () => {
    let latest: { id: string; confirmCount: number }[] = [];
    repo.subscribe((reports) => {
      latest = reports;
    });
    const target = latest.find((r) => r.id === "seed-lau-elevator")!;
    const before = target.confirmCount;

    await repo.confirmStillActive("seed-lau-elevator", "user-1");
    await repo.confirmStillActive("seed-lau-elevator", "user-1"); // repeat — should be a no-op

    const after = latest.find((r) => r.id === "seed-lau-elevator")!;
    expect(after.confirmCount).toBe(before + 1);
  });

  it("confirmFixed increments fixedCount once per user, ignoring repeats", async () => {
    let latest: { id: string; fixedCount: number }[] = [];
    repo.subscribe((reports) => {
      latest = reports;
    });
    const target = latest.find((r) => r.id === "seed-healy-ramp")!;
    const before = target.fixedCount;

    await repo.confirmFixed("seed-healy-ramp", "user-1");
    await repo.confirmFixed("seed-healy-ramp", "user-1"); // repeat — should be a no-op

    const after = latest.find((r) => r.id === "seed-healy-ramp")!;
    expect(after.fixedCount).toBe(before + 1);
  });

  it("auto-resolves a report once enough users confirm it's fixed", async () => {
    let latest: { id: string; status: string; fixedCount: number }[] = [];
    repo.subscribe((reports) => {
      latest = reports;
    });

    await repo.confirmFixed("seed-healy-ramp", "user-1");
    expect(latest.find((r) => r.id === "seed-healy-ramp")?.status).toBe("active");

    await repo.confirmFixed("seed-healy-ramp", "user-2");
    expect(latest.find((r) => r.id === "seed-healy-ramp")?.status).toBe("resolved");
  });

  it("confirmStillActive refreshes lastConfirmedAt and pushes expiresAt forward", async () => {
    let latest: { id: string; lastConfirmedAt: string; expiresAt: string }[] = [];
    repo.subscribe((reports) => {
      latest = reports;
    });
    const before = latest.find((r) => r.id === "seed-i9-entrance")!; // seeded stale/expired

    await repo.confirmStillActive("seed-i9-entrance", "user-1");

    const after = latest.find((r) => r.id === "seed-i9-entrance")!;
    expect(new Date(after.lastConfirmedAt).getTime()).toBeGreaterThan(new Date(before.lastConfirmedAt).getTime());
    expect(new Date(after.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("markResolved flips status without affecting other reports", async () => {
    let latest: { id: string; status: string }[] = [];
    repo.subscribe((reports) => {
      latest = reports;
    });

    await repo.markResolved("seed-lau-elevator");

    expect(latest.find((r) => r.id === "seed-lau-elevator")?.status).toBe("resolved");
    expect(latest.find((r) => r.id === "seed-healy-ramp")?.status).toBe("active");
  });

  it("unsubscribe stops further notifications", async () => {
    let callCount = 0;
    const unsubscribe = repo.subscribe(() => {
      callCount++;
    });
    unsubscribe();

    await repo.submitReport("user-1", {
      placeId: "lauinger-library",
      issueType: "other",
      description: "Should not be observed",
      severity: "low",
    });

    expect(callCount).toBe(1); // only the initial call on subscribe
  });
});
