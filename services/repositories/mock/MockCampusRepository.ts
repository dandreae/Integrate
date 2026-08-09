import type { Campus, ConstructionZone, MockCampusUser } from "@/types";
import { CAMPUSES, CONSTRUCTION_ZONES, MOCK_CAMPUS_USERS } from "@/data";
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

  async getMockUsers(campusId: string): Promise<MockCampusUser[]> {
    return MOCK_CAMPUS_USERS.filter((user) => user.campusId === campusId);
  }
}
