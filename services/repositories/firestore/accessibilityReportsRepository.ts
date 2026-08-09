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
import { ACCESSIBILITY_REPORT_CONFIG } from "@/constants/accessibilityReports";
import { computeExpiresAt } from "@/services/accessibility/reportConfidence";
import type { AccessibilityReport, AccessibilityReportSeverity, NewAccessibilityReportPayload } from "@/types";
import type { AccessibilityReportRepository } from "../AccessibilityReportRepository";

const COLLECTION = "accessibilityReports";

function toIso(timestamp: { toMillis?: () => number } | undefined, fallback: string): string {
  return timestamp?.toMillis?.() ? new Date(timestamp.toMillis()).toISOString() : fallback;
}

/**
 * Live mode: real-time, multi-user accessibility reports. Reports are
 * visible immediately on submission (unlike proposals/construction zones,
 * which wait for confirmation votes) — a broken elevator matters right now,
 * not after a threshold is crossed. The one-confirmation-per-user rule is
 * enforced the same way as proposal confirmations: a `confirmations/{uid}` /
 * `fixedVotes/{uid}` subcollection doc that can only be created once per
 * user.
 *
 * `expiresAt` is a plain computed ISO string (not `serverTimestamp()`) —
 * it's a future date we compute client-side from severity, not "the time
 * this write occurred", so `serverTimestamp()` doesn't apply.
 */
export class FirestoreAccessibilityReportRepository implements AccessibilityReportRepository {
  subscribe(onChange: (reports: AccessibilityReport[]) => void): () => void {
    return onSnapshot(collection(db, COLLECTION), (snapshot) => {
      const reports: AccessibilityReport[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const reportedAt = toIso(data.reportedAt, new Date().toISOString());
        return {
          id: docSnap.id,
          placeId: data.placeId,
          entranceId: data.entranceId,
          issueType: data.issueType,
          description: data.description,
          severity: data.severity ?? "medium",
          reportedAt,
          lastConfirmedAt: toIso(data.lastConfirmedAt, reportedAt),
          expiresAt: data.expiresAt ?? computeExpiresAt(reportedAt, data.severity ?? "medium"),
          status: data.status,
          confirmCount: data.confirmCount ?? 0,
          fixedCount: data.fixedCount ?? 0,
          submittedBy: data.submittedBy,
          resolvedAt: data.resolvedAt ? toIso(data.resolvedAt, reportedAt) : undefined,
        };
      });
      onChange(reports);
    });
  }

  async submitReport(uid: string, payload: NewAccessibilityReportPayload): Promise<void> {
    const now = new Date();
    await addDoc(collection(db, COLLECTION), {
      ...payload,
      status: "active",
      confirmCount: 0,
      fixedCount: 0,
      submittedBy: uid,
      reportedAt: serverTimestamp(),
      lastConfirmedAt: serverTimestamp(),
      expiresAt: computeExpiresAt(now, payload.severity),
    });
  }

  async confirmStillActive(reportId: string, uid: string): Promise<void> {
    const reportRef = doc(db, COLLECTION, reportId);
    const confirmationRef = doc(db, COLLECTION, reportId, "confirmations", uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(reportRef);
        const severity = (snap.data()?.severity ?? "medium") as AccessibilityReportSeverity;
        tx.set(confirmationRef, { confirmedAt: serverTimestamp() });
        tx.update(reportRef, {
          confirmCount: increment(1),
          lastConfirmedAt: serverTimestamp(),
          expiresAt: computeExpiresAt(new Date(), severity),
        });
      });
    } catch (error) {
      // Doc ID == uid: a repeat confirm targets an existing confirmation doc,
      // which the rules only allow `create` on — treat as an expected no-op.
      if ((error as { code?: string }).code === "permission-denied") return;
      throw error;
    }
  }

  async confirmFixed(reportId: string, uid: string): Promise<void> {
    const reportRef = doc(db, COLLECTION, reportId);
    const fixedVoteRef = doc(db, COLLECTION, reportId, "fixedVotes", uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(reportRef);
        const data = snap.data();
        const fixedCount = (data?.fixedCount ?? 0) + 1;
        const resolved = fixedCount >= ACCESSIBILITY_REPORT_CONFIG.fixedVoteResolveThreshold;

        tx.set(fixedVoteRef, { confirmedAt: serverTimestamp() });
        tx.update(reportRef, {
          fixedCount,
          lastConfirmedAt: serverTimestamp(),
          ...(resolved ? { status: "resolved", resolvedAt: serverTimestamp() } : {}),
        });
      });
    } catch (error) {
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
