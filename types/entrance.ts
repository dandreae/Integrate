/** Slope category of the ramp serving an entrance, if any. */
export type RampSlope = "none" | "gentle" | "moderate" | "steep";

/** A known temporary obstruction at an entrance — distinct from a permanent accessibility rating. */
export interface EntranceClosure {
  reason: string;
  /** ISO date the closure was first reported, if known. */
  since?: string;
  /** ISO date the closure is expected to end, if known. */
  expectedReopenDate?: string;
}

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
  /** Slope of the ramp serving this entrance, if it has one. */
  rampSlope?: RampSlope;
  /** Doors open automatically (button/sensor), reducing the strength/dexterity needed to enter. */
  hasAutomaticDoor?: boolean;
  /** A curb cut connects the adjacent sidewalk/street to this entrance's level, avoiding a curb step. */
  hasCurbCut?: boolean;
  /** Clear door width in inches. ADA minimum clear width is 32". */
  doorWidthInches?: number;
  /** Set when this entrance is temporarily closed or obstructed (construction, broken door, etc.) — independent of `isAccessible`, which describes its normal/permanent state. */
  temporaryClosure?: EntranceClosure;
}
