export type ConstructionSeverity = "low" | "medium" | "high";

/**
 * "reported": a student/staff report, not yet confirmed — routes should still
 * be offered through it, just penalized and flagged.
 * "confirmed-closure": verified as impassable — any candidate route through
 * it must be rejected outright, not merely penalized.
 * Absent is treated as "reported" for backward compatibility with existing data.
 */
export type ConstructionZoneStatus = "reported" | "confirmed-closure";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface ConstructionZone {
  id: string;
  campusId: string;
  title: string;
  description: string;
  /** Path or polygon marking the affected area, in map coordinates. */
  coordinates: LatLng[];
  severity: ConstructionSeverity;
  startDate: string;
  endDate: string;
  affectedAccessibility: boolean;
  status?: ConstructionZoneStatus;
}
