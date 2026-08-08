import type { LatLng } from "./construction";

/**
 * A synthetic campus "presence" — demo data only, never a real person's real
 * location. See data/mockUsers.ts for why this stays mock-only rather than
 * getting a Firestore-backed "live" mode like other repositories: real
 * live user location is a much bigger feature (opt-in consent, a presence
 * backend, privacy controls over who can see you) that this doesn't attempt.
 */
export interface MockCampusUser {
  id: string;
  campusId: string;
  name: string;
  avatarInitials: string;
  avatarColor: string;
  currentLocation: LatLng;
  /** CampusEvent ids this user has saved / plans to attend. */
  savedEventIds: string[];
}
