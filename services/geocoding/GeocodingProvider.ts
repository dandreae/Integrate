import type { LatLng } from "@/types";

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  /** Free-text category hint from the source data (e.g. "university", "cafe"), if any. */
  categoryHint?: string;
}

export interface GeocodingProvider {
  readonly name: string;
  /**
   * Free-text place search, biased toward (not strictly bounded by) `near`.
   * Returns [] on no matches. Callers should treat network failures as "no
   * results" rather than surfacing an error — this is a nice-to-have
   * complement to curated place data, not a required path.
   */
  search(query: string, near: LatLng): Promise<GeocodeResult[]>;
}
