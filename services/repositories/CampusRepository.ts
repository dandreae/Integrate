import type { Campus, ConstructionZone, MockCampusUser } from "@/types";

/**
 * Campus-level data access. The mock implementation reads from local fixture
 * data; a future Supabase-backed implementation can satisfy this same
 * interface without any calling code changing.
 *
 * Events live on their own EventRepository (services/repositories/EventRepository.ts)
 * — unlike this static/curated data, events come from a live external
 * source with their own provider abstraction, caching, and fallback ladder.
 */
export interface CampusRepository {
  getCampuses(): Promise<Campus[]>;
  getCampusById(campusId: string): Promise<Campus | undefined>;
  getConstructionZones(campusId: string): Promise<ConstructionZone[]>;
  /** Demo-only "who's around" presence layer — see data/mockUsers.ts. */
  getMockUsers(campusId: string): Promise<MockCampusUser[]>;
}
