import type { Campus, CampusEvent, ConstructionZone } from "@/types";

/**
 * Campus-level data access. The mock implementation reads from local fixture
 * data; a future Supabase-backed implementation can satisfy this same
 * interface without any calling code changing.
 */
export interface CampusRepository {
  getCampuses(): Promise<Campus[]>;
  getCampusById(campusId: string): Promise<Campus | undefined>;
  getConstructionZones(campusId: string): Promise<ConstructionZone[]>;
  getEvents(campusId: string): Promise<CampusEvent[]>;
}
