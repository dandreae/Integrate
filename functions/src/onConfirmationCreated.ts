import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { CONFIRMATION_THRESHOLD } from "./constants";
import { sendExpoPushMessages } from "./pushClient";

/**
 * Counts a distinct confirmation toward a proposal's threshold and, once it
 * crosses CONFIRMATION_THRESHOLD, applies the edit (writes placeOverrides or
 * constructionZones) and notifies the original submitter.
 */
export const onConfirmationCreated = onDocumentCreated(
  "proposals/{proposalId}/confirmations/{uid}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const { proposalId, uid } = event.params;
    const db = admin.firestore();
    const proposalRef = db.doc(`proposals/${proposalId}`);

    const proposalSnap = await proposalRef.get();
    const proposal = proposalSnap.data();
    if (!proposal) return;

    // Defense in depth — security rules should already block a submitter
    // from confirming their own proposal.
    if (uid === proposal.submittedBy) {
      await snapshot.ref.delete();
      return;
    }

    let approvedNow = false;
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(proposalRef);
      const data = fresh.data();
      if (!data || data.status !== "pending") return;

      const confirmCount = (data.confirmCount ?? 0) + 1;
      const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = { confirmCount };
      if (confirmCount >= CONFIRMATION_THRESHOLD) {
        update.status = "approved";
        approvedNow = true;
      }
      tx.update(proposalRef, update);
    });

    if (!approvedNow) return;

    const finalSnap = await proposalRef.get();
    const finalData = finalSnap.data();
    if (!finalData) return;

    if (finalData.type === "rename") {
      await db.doc(`placeOverrides/${finalData.payload.placeId}`).set({
        proposedOfficialName: finalData.payload.proposedOfficialName ?? null,
        proposedLocalName: finalData.payload.proposedLocalName ?? null,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        sourceProposalId: proposalId,
      });
    } else {
      await db
        .collection("constructionZones")
        .doc(proposalId)
        .set({
          ...finalData.payload,
          submittedBy: finalData.submittedBy,
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          sourceProposalId: proposalId,
        });
    }

    const submitterSnap = await db.doc(`users/${finalData.submittedBy}`).get();
    const pushToken = submitterSnap.data()?.pushToken;
    if (typeof pushToken === "string") {
      await sendExpoPushMessages([
        {
          to: pushToken,
          title: "Your edit was approved",
          body: "Enough students confirmed your suggestion — it's now live on the map.",
          data: { proposalId, type: finalData.type },
        },
      ]);
    }
  }
);
