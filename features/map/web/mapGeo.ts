import type L from "leaflet";
import type { LatLng, MapRegion } from "@/types";

/**
 * Leaflet works in zoom levels, not lat/lng deltas — react-native-maps'
 * MapRegion has no zoom concept at all. This approximates the zoom level
 * that would show roughly `longitudeDelta` degrees of width, using the
 * standard "world is 360deg wide at zoom 0" relationship. Not exact (it
 * ignores viewport aspect ratio/pixel size, which Leaflet doesn't know until
 * mount), but close enough that centering/framing looks right.
 */
export function regionToZoom(region: Pick<MapRegion, "longitudeDelta">): number {
  const raw = Math.log2(360 / region.longitudeDelta);
  return Math.min(19, Math.max(3, Math.round(raw)));
}

export function toLatLngTuple(point: LatLng): [number, number] {
  return [point.latitude, point.longitude];
}

/** Mirrors react-native-maps' fitToCoordinates edgePadding (points) as Leaflet's pixel padding pairs. */
export function edgePaddingToLeafletPadding(edgePadding?: {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}): { paddingTopLeft: L.PointExpression; paddingBottomRight: L.PointExpression } {
  return {
    paddingTopLeft: [edgePadding?.left ?? 40, edgePadding?.top ?? 40],
    paddingBottomRight: [edgePadding?.right ?? 40, edgePadding?.bottom ?? 40],
  };
}
