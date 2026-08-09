import { collection, doc, getDoc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { CampusEvent } from "@/types";

const EVENTS_COLLECTION = "events";
const CACHE_META_COLLECTION = "eventsCacheMeta";

export interface EventsCacheMeta {
  fetchedAt: number;
  source: string;
}

/**
 * Campus-wide events cache in Firestore — a genuinely different trust model
 * from every other collection in this app (proposals/reports/discover posts
 * are all user-submitted and tied to `submittedBy == request.auth.uid`).
 * This is a mirror of public, non-attributed calendar data: any signed-in
 * client may refresh it (see firestore.rules), since there's no Cloud
 * Functions on the Spark plan to do it server-side on a schedule.
 */

export async function readEventsCacheMeta(campusId: string): Promise<EventsCacheMeta | null> {
  const snap = await getDoc(doc(db, CACHE_META_COLLECTION, campusId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    fetchedAt: data.fetchedAt?.toMillis?.() ?? 0,
    source: data.source ?? "unknown",
  };
}

/** Needs the composite index declared in firestore.indexes.json (campusId asc, startAt asc). */
export async function readCachedEvents(campusId: string): Promise<CampusEvent[]> {
  const nowIso = new Date().toISOString();
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where("campusId", "==", campusId),
    where("startAt", ">=", nowIso)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => docSnap.data() as CampusEvent);
}

/** Upserts every event plus a fresh cache-meta timestamp in one batch. Best-effort — callers should treat a write failure as non-fatal. */
export async function writeEventsCache(campusId: string, events: CampusEvent[], source: string): Promise<void> {
  const batch = writeBatch(db);
  for (const event of events) {
    batch.set(doc(db, EVENTS_COLLECTION, event.id), event);
  }
  batch.set(doc(db, CACHE_META_COLLECTION, campusId), { fetchedAt: serverTimestamp(), source });
  await batch.commit();
}
