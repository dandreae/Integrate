/**
 * Number of distinct other users who must confirm a proposal before it's
 * applied. Duplicated as a literal in firestore.rules (rules can't import TS
 * constants) — keep both in sync. Lower this for local testing; reaching 10
 * distinct confirmers organically isn't realistic outside of real usage.
 */
export const CONFIRMATION_THRESHOLD = 10;
