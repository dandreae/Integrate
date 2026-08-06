import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { AccessibilityReport, NewAccessibilityReportPayload } from "@/types";
import type { AccessibilityReportRepository } from "../AccessibilityReportRepository";

const COLLECTION = "accessibilityReports";

/**
 * Live mode: real-time, multi-user accessibility reports. Reports are
 * visible immediately on submission (unlike proposals/construction zones,
 * which wait for confirmation votes) — a broken elevator matters right now,
 * not after a threshold is crossed. The one-confirmation-per-user rule is
 * enforced the same way as proposal confirmations: a `confirmations/{uid}`
 * subcollection doc that can only be created once per user.
 */
export class FirestoreAccessibilityReportRepository implements AccessibilityReportRepository {
  subscribe(onChange: (reports: AccessibilityReport[]) => void): () => void {
    return onSnapshot(collection(db, COLLECTION), (snapshot) => {
      const reports: AccessibilityReport[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          placeId: data.placeId,
          entranceId: data.entranceId,
          issueType: data.issueType,
          description: data.description,
          reportedAt: data.reportedAt?.toMillis?.() ? new Date(data.reportedAt.toMillis()).toISOString() : new Date().toISOString(),
          status: data.status,
          confirmCount: data.confirmCount ?? 0,
          submittedBy: data.submittedBy,
        };
      });
      onChange(reports);
    });
  }

  async submitReport(uid: string, payload: NewAccessibilityReportPayload): Promise<void> {
    await addDoc(collection(db, COLLECTION), {
      ...payload,
      status: "active",
      confirmCount: 0,
      submittedBy: uid,
      reportedAt: serverTimestamp(),
    });
  }

  async confirmStillActive(reportId: string, uid: string): Promise<void> {
    const reportRef = doc(db, COLLECTION, reportId);
    const confirmationRef = doc(db, COLLECTION, reportId, "confirmations", uid);
    try {
      await runTransaction(db, async (tx) => {
        tx.set(confirmationRef, { confirmedAt: serverTimestamp() });
        tx.update(reportRef, { confirmCount: increment(1) });
      });
    } catch (error) {
      // Doc ID == uid: a repeat confirm targets an existing confirmation doc,
      // which the rules only allow `create` on — treat as an expected no-op.
      if ((error as { code?: string }).code === "permission-denied") return;
      throw error;
    }
  }

  async markResolved(reportId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, reportId), {
      status: "resolved",
      resolvedAt: serverTimestamp(),
    });
  }
}
