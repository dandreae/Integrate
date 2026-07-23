import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { sendExpoPushMessages } from "./pushClient";

/** Notifies every other user with a push token that a new proposal needs review. */
export const onProposalCreated = onDocumentCreated("proposals/{proposalId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const proposal = snapshot.data();
  const proposalId = event.params.proposalId;

  const usersSnapshot = await admin.firestore().collection("users").get();
  const messages = usersSnapshot.docs
    .filter((doc) => doc.id !== proposal.submittedBy && typeof doc.data().pushToken === "string")
    .map((doc) => ({
      to: doc.data().pushToken as string,
      title: "New edit to review",
      body: summarize(proposal),
      data: { proposalId, type: proposal.type },
    }));

  await sendExpoPushMessages(messages);
});

function summarize(proposal: FirebaseFirestore.DocumentData): string {
  if (proposal.type === "rename") {
    return `Rename "${proposal.payload.currentOfficialName}" to "${proposal.payload.proposedOfficialName}"?`;
  }
  return `Construction reported: ${proposal.payload.title}`;
}
