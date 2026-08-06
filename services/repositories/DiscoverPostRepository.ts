import type { DiscoverPost, NewDiscoverPostPayload } from "@/types";

export interface DiscoverPostRepository {
  /** Live-updating feed, newest first. Returns an unsubscribe function. */
  subscribe(onChange: (posts: DiscoverPost[]) => void): () => void;
  submitPost(uid: string, payload: NewDiscoverPostPayload): Promise<void>;
  /** "Still going on" / "I second this" — one per user, enforced by the implementation. */
  upvote(postId: string, uid: string): Promise<void>;
}
