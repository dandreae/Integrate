/**
 * Number of distinct other users who must confirm a proposal before it's
 * applied. Duplicated in constants/proposals.ts on the client (this package
 * can't import client code across the workspace boundary) — keep both in
 * sync. Lower this for local testing; reaching 10 distinct confirmers
 * organically isn't realistic outside of real usage.
 */
export const CONFIRMATION_THRESHOLD = 10;
