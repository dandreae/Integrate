export interface Entrance {
  id: string;
  placeId: string;
  latitude: number;
  longitude: number;
  label: string;
  isAccessible: boolean;
  notes?: string;
  /** ISO date this entrance's accessibility status was last confirmed by a human, if known. */
  accessibilityVerifiedAt?: string;
  /** Known to require stairs to reach, independent of `isAccessible`. */
  hasStairs?: boolean;
}
