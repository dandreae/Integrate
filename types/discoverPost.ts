/**
 * "promotion": general business content (new hours, new item) — not
 *              necessarily a discount.
 * "deal": a specific discount/offer.
 * "event": something happening at a time.
 * "student-post": a short, casual comment about what's going on somewhere —
 *                 the Fizz-style "little comment" post, usually no title.
 */
export type DiscoverPostType = "promotion" | "deal" | "event" | "student-post";

export interface DiscoverPost {
  id: string;
  type: DiscoverPostType;
  /** Optional — student-post entries are often just a one-line comment with no title. */
  title?: string;
  description: string;
  /** Every post must link a real campus place — this is never optional. */
  placeId: string;
  /** Optional refinement on top of the linked place, e.g. "3rd floor" or "outside the north entrance". */
  locationDetail?: string;
  postedAt: string;
  /** Mainly for "deal"/"promotion" posts — when it's no longer valid. */
  expiresAt?: string;
  /** Present on live (Firestore) posts; absent on seeded demo data. */
  submittedBy?: string;
  /** "Still going on" / "I second this" count. */
  upvotes: number;
}

export interface NewDiscoverPostPayload {
  type: DiscoverPostType;
  title?: string;
  description: string;
  placeId: string;
  locationDetail?: string;
  expiresAt?: string;
}
