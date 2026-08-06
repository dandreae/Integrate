import { PhotonGeocodingProvider } from "./PhotonGeocodingProvider";

export type { GeocodeResult, GeocodingProvider } from "./GeocodingProvider";
export { toDroppedPinPlace, toSyntheticPlace } from "./toSyntheticPlace";
export { expandNicknameAlias } from "./nicknameAliases";
export { looksLikeAbbreviation, matchesAbbreviation } from "./abbreviationMatch";
export { fetchNearbyNamedFeatures, type MapBounds } from "./nearbyFeaturesCache";

export const geocodingProvider = new PhotonGeocodingProvider();
