import * as admin from "firebase-admin";

admin.initializeApp();

export { onProposalCreated } from "./onProposalCreated";
export { onConfirmationCreated } from "./onConfirmationCreated";
