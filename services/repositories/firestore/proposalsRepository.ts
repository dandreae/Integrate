import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { CONFIRMATION_THRESHOLD } from "@/constants/proposals";
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
 * Confirms a proposal on behalf of `uid` and, if this confirmation crosses
 * CONFIRMATION_THRESHOLD, applies the edit. There's no trusted server here
 * (no Cloud Functions on the Spark plan) — a Firestore transaction plus
 * firestore.rules do what onConfirmationCreated used to do. The confirmation
 * doc's ID is the uid itself, so a repeat confirm targets an already-existing
 * document; rules only allow `create` (not `update`) on that path, so a
 * second attempt is rejected with `permission-denied`, treated here as an
 * expected "already confirmed" no-op rather than an error.
 */
export async function confirmProposal(proposalId: string, uid: string): Promise<void> {
  const proposalRef = doc(db, "proposals", proposalId);
  const confirmationRef = doc(db, "proposals", proposalId, "confirmations", uid);
  let approved: Proposal | null = null;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(proposalRef);
      const data = snap.data();
      if (!data || data.status !== "pending") return;

      const confirmCount = (data.confirmCount ?? 0) + 1;
      const isApproved = confirmCount >= CONFIRMATION_THRESHOLD;

      tx.set(confirmationRef, { confirmedAt: serverTimestamp() });
      tx.update(proposalRef, {
        confirmCount,
        status: isApproved ? "approved" : "pending",
        ...(isApproved ? { approvedAt: serverTimestamp() } : {}),
      });

      if (isApproved) {
        approved = {
          id: proposalId,
          type: data.type,
          status: "approved",
          submittedBy: data.submittedBy,
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
          confirmCount,
          payload: data.payload,
        };
      }
    });
  } catch (error) {
    if ((error as { code?: string }).code === "permission-denied") return;
    throw error;
  }

  if (approved) await applyApprovedProposal(approved);
}

/**
 * Writes the actual edit once a proposal has crossed the confirmation
 * threshold. Gated by firestore.rules on the target collection (requires the
 * sourceProposalId's proposal to already have status "approved"), since
 * there's no admin SDK to trust this write unconditionally anymore.
 */
async function applyApprovedProposal(proposal: Proposal): Promise<void> {
  if (proposal.type === "rename") {
    const payload = proposal.payload as RenameProposalPayload;
    await setDoc(doc(db, "placeOverrides", payload.placeId), {
      proposedOfficialName: payload.proposedOfficialName ?? null,
      proposedLocalName: payload.proposedLocalName ?? null,
      approvedAt: serverTimestamp(),
      sourceProposalId: proposal.id,
    });
  } else {
    const payload = proposal.payload as ConstructionZoneProposalPayload;
    await setDoc(doc(db, "constructionZones", proposal.id), {
      ...payload,
      submittedBy: proposal.submittedBy,
      approvedAt: serverTimestamp(),
      sourceProposalId: proposal.id,
    });
  }
}
