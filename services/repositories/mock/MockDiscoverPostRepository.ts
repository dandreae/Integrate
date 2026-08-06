import { SEEDED_DISCOVER_POSTS } from "@/data/discoverPosts";
import type { DiscoverPost, NewDiscoverPostPayload } from "@/types";
import type { DiscoverPostRepository } from "../DiscoverPostRepository";

function sortByNewest(posts: DiscoverPost[]): DiscoverPost[] {
  return [...posts].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
}

/**
 * Offline/demo mode: seeded from data/discoverPosts.ts, mutated in-memory
 * for the session — submissions/upvotes don't persist across app restarts.
 * Swap to MODE=live for the real Firestore-backed repository.
 */
export class MockDiscoverPostRepository implements DiscoverPostRepository {
  private posts: DiscoverPost[] = [...SEEDED_DISCOVER_POSTS];
  private upvotedByUser = new Set<string>(); // `${postId}:${uid}`
  private listeners = new Set<(posts: DiscoverPost[]) => void>();

  private notify() {
    const snapshot = sortByNewest(this.posts);
    this.listeners.forEach((listener) => listener(snapshot));
  }

  subscribe(onChange: (posts: DiscoverPost[]) => void): () => void {
    this.listeners.add(onChange);
    onChange(sortByNewest(this.posts));
    return () => this.listeners.delete(onChange);
  }

  async submitPost(uid: string, payload: NewDiscoverPostPayload): Promise<void> {
    this.posts = [
      ...this.posts,
      {
        id: `mock-${Date.now()}`,
        ...payload,
        postedAt: new Date().toISOString(),
        upvotes: 0,
        submittedBy: uid,
      },
    ];
    this.notify();
  }

  async upvote(postId: string, uid: string): Promise<void> {
    const key = `${postId}:${uid}`;
    if (this.upvotedByUser.has(key)) return; // one upvote per user, same as live rules enforce
    this.upvotedByUser.add(key);
    this.posts = this.posts.map((post) => (post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post));
    this.notify();
  }
}
