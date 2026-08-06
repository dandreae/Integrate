import { beforeEach, describe, expect, it } from "vitest";
import { MockDiscoverPostRepository } from "../MockDiscoverPostRepository";

describe("MockDiscoverPostRepository", () => {
  let repo: MockDiscoverPostRepository;

  beforeEach(() => {
    repo = new MockDiscoverPostRepository();
  });

  it("is seeded with demo data, newest first", () => {
    let latest: { postedAt: string }[] = [];
    repo.subscribe((posts) => {
      latest = posts;
    });
    expect(latest.length).toBeGreaterThan(0);
    for (let i = 1; i < latest.length; i++) {
      expect(new Date(latest[i - 1].postedAt).getTime()).toBeGreaterThanOrEqual(new Date(latest[i].postedAt).getTime());
    }
  });

  it("notifies subscribers when a post is submitted, newest first", async () => {
    let latest: { title?: string }[] = [];
    repo.subscribe((posts) => {
      latest = posts;
    });
    const before = latest.length;

    await repo.submitPost("user-1", {
      type: "deal",
      title: "Brand new deal",
      description: "Test",
      placeId: "lauinger-library",
    });

    expect(latest.length).toBe(before + 1);
    expect(latest[0].title).toBe("Brand new deal");
  });

  it("allows a title-less post (student-post style)", async () => {
    let latest: { title?: string; description: string }[] = [];
    repo.subscribe((posts) => {
      latest = posts;
    });

    await repo.submitPost("user-1", {
      type: "student-post",
      description: "the line at leo's is wild rn",
      placeId: "leos-dining-hall",
    });

    expect(latest[0].title).toBeUndefined();
    expect(latest[0].description).toBe("the line at leo's is wild rn");
  });

  it("upvote increments once per user, ignoring repeats", async () => {
    let latest: { id: string; upvotes: number }[] = [];
    repo.subscribe((posts) => {
      latest = posts;
    });
    const target = latest[0];
    const before = target.upvotes;

    await repo.upvote(target.id, "user-1");
    await repo.upvote(target.id, "user-1"); // repeat — should be a no-op

    const after = latest.find((p) => p.id === target.id)!;
    expect(after.upvotes).toBe(before + 1);
  });

  it("different users can each upvote the same post once", async () => {
    let latest: { id: string; upvotes: number }[] = [];
    repo.subscribe((posts) => {
      latest = posts;
    });
    const target = latest[0];
    const before = target.upvotes;

    await repo.upvote(target.id, "user-1");
    await repo.upvote(target.id, "user-2");

    const after = latest.find((p) => p.id === target.id)!;
    expect(after.upvotes).toBe(before + 2);
  });

  it("unsubscribe stops further notifications", async () => {
    let callCount = 0;
    const unsubscribe = repo.subscribe(() => {
      callCount++;
    });
    unsubscribe();

    await repo.submitPost("user-1", { type: "promotion", title: "x", description: "y", placeId: "vital-vittles" });

    expect(callCount).toBe(1); // only the initial call on subscribe
  });
});
