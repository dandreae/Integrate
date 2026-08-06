import { addDoc, collection, doc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { DiscoverPost, NewDiscoverPostPayload } from "@/types";
import type { DiscoverPostRepository } from "../DiscoverPostRepository";

const COLLECTION = "discoverPosts";

/**
 * Live mode: real-time, multi-user Discover feed. Posts are visible
 * immediately on submission — this is a casual community feed, not a
 * moderated proposal queue. The one-upvote-per-user rule is enforced the
 * same way as accessibility report confirmations: a `upvotes/{uid}`
 * subcollection doc that can only be created once per user.
 */
export class FirestoreDiscoverPostRepository implements DiscoverPostRepository {
  subscribe(onChange: (posts: DiscoverPost[]) => void): () => void {
    const q = query(collection(db, COLLECTION), orderBy("postedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const posts: DiscoverPost[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          type: data.type,
          title: data.title,
          description: data.description,
          placeId: data.placeId,
          locationLabel: data.locationLabel,
          postedAt: data.postedAt?.toMillis?.() ? new Date(data.postedAt.toMillis()).toISOString() : new Date().toISOString(),
          expiresAt: data.expiresAt,
          submittedBy: data.submittedBy,
          upvotes: data.upvotes ?? 0,
        };
      });
      onChange(posts);
    });
  }

  async submitPost(uid: string, payload: NewDiscoverPostPayload): Promise<void> {
    await addDoc(collection(db, COLLECTION), {
      ...payload,
      upvotes: 0,
      submittedBy: uid,
      postedAt: serverTimestamp(),
    });
  }

  async upvote(postId: string, uid: string): Promise<void> {
    const postRef = doc(db, COLLECTION, postId);
    const upvoteRef = doc(db, COLLECTION, postId, "upvotes", uid);
    try {
      await runTransaction(db, async (tx) => {
        tx.set(upvoteRef, { upvotedAt: serverTimestamp() });
        tx.update(postRef, { upvotes: increment(1) });
      });
    } catch (error) {
      // Doc ID == uid: a repeat upvote targets an existing doc, which the
      // rules only allow `create` on — treat as an expected no-op.
      if ((error as { code?: string }).code === "permission-denied") return;
      throw error;
    }
  }
}
