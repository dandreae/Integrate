import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { ConstructionZoneProposalPayload, Proposal, RenameProposalPayload } from "@/types";

export function subscribeToPendingProposals(onChange: (proposals: Proposal[]) => void) {
  const q = query(collection(db, "proposals"), where("status", "==", "pending"));
  return onSnapshot(q, (snapshot) => {
    const proposals: Proposal[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        type: data.type,
        status: data.status,
        submittedBy: data.submittedBy,
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        confirmCount: data.confirmCount ?? 0,
        payload: data.payload,
      };
    });
    onChange(proposals);
  });
}

export async function submitRenameProposal(uid: string, payload: RenameProposalPayload) {
  await addDoc(collection(db, "proposals"), {
    type: "rename",
    status: "pending",
    submittedBy: uid,
    createdAt: serverTimestamp(),
    confirmCount: 0,
    payload,
  });
}

export async function submitConstructionZoneProposal(
  uid: string,
  payload: ConstructionZoneProposalPayload
) {
  await addDoc(collection(db, "proposals"), {
    type: "construction-zone",
    status: "pending",
    submittedBy: uid,
    createdAt: serverTimestamp(),
    confirmCount: 0,
    payload,
  });
}

/**
 * Confirms a proposal on behalf of `uid`. The confirmation doc's ID is the
 * uid itself, so a repeat confirm targets an already-existing document —
 * Firestore rules only allow `create` (not `update`) on this path, so a
 * second attempt is rejected with `permission-denied`, which we treat as an
 * expected "already confirmed" no-op rather than an error.
 */
export async function confirmProposal(proposalId: string, uid: string): Promise<void> {
  try {
    await setDoc(doc(db, "proposals", proposalId, "confirmations", uid), {
      confirmedAt: serverTimestamp(),
    });
  } catch (error) {
    if ((error as { code?: string }).code === "permission-denied") return;
    throw error;
  }
}
