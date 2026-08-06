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
    });

    expect(callCount).toBe(1); // only the initial call on subscribe
  });
});
