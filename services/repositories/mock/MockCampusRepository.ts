import type { Campus, CampusEvent, ConstructionZone } from "@/types";
import { CAMPUSES, CAMPUS_EVENTS, CONSTRUCTION_ZONES } from "@/data";
import type { CampusRepository } from "../CampusRepository";

/**
 * Reads from local fixture data. Replace with a Supabase-backed
 * implementation later without changing the CampusRepository interface or
 * any calling code.
 */
export class MockCampusRepository implements CampusRepository {
  async getCampuses(): Promise<Campus[]> {
    return CAMPUSES;
  }

  async getCampusById(campusId: string): Promise<Campus | undefined> {
    return CAMPUSES.find((campus) => campus.id === campusId);
  }

  async getConstructionZones(campusId: string): Promise<ConstructionZone[]> {
    return CONSTRUCTION_ZONES.filter((zone) => zone.campusId === campusId);
  }

  async getEvents(campusId: string): Promise<CampusEvent[]> {
    return CAMPUS_EVENTS.filter((event) => event.campusId === campusId);
  }
}
