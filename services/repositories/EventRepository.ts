import type { CampusEvent } from "@/types";

export interface EventRepository {
  getEvents(campusId: string): Promise<CampusEvent[]>;
}
