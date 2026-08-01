import { PhotonGeocodingProvider } from "./PhotonGeocodingProvider";

export type { GeocodeResult, GeocodingProvider } from "./GeocodingProvider";
export { toSyntheticPlace } from "./toSyntheticPlace";

export const geocodingProvider = new PhotonGeocodingProvider();
