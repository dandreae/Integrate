export type ConstructionSeverity = "low" | "medium" | "high";

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
  /** ISO date this zone's status was last confirmed accurate. */
  dataLastVerifiedAt: string;
  verificationSource: string;
}
