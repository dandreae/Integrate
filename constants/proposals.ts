/**
 * Number of distinct other users who must confirm a proposal before it's
 * applied. Duplicated in functions/src/constants.ts (Cloud Functions can't
 * import client code across the package boundary) — keep both in sync.
 * Lower this for local testing; reaching 10 distinct confirmers organically
 * isn't realistic outside of real usage.
 */
export const CONFIRMATION_THRESHOLD = 10;
