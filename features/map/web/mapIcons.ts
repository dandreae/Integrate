import L from "leaflet";
import { colors } from "@/constants/theme";

/**
 * Leaflet markers render through imperative DOM (an HTML string), not React
 * — none of the native app's marker components (PlaceMarker, EventMarker,
 * etc.) can be reused here, since they render Ionicons via React Native
 * primitives and (more importantly) live in files that import
 * "react-native-maps", which has no web implementation and would break the
 * web bundle if pulled in. These build small colored badge icons instead,
 * using plain emoji glyphs — already an established pattern in this app,
 * see ACCESSIBILITY_CONFIDENCE_META in constants/categories.ts.
 */
interface BadgeIconOptions {
  color: string;
  glyph: string;
  size?: number;
  square?: boolean;
  selected?: boolean;
}

export function buildBadgeIcon({ color, glyph, size = 28, square = false, selected = false }: BadgeIconOptions): L.DivIcon {
  const dimension = selected ? size + 6 : size;
  const borderRadius = square ? "8px" : "999px";
  const fontSize = Math.round(dimension * 0.5);
  return L.divIcon({
    className: "integrate-map-badge",
    html: `<div style="
      width: ${dimension}px;
      height: ${dimension}px;
      border-radius: ${borderRadius};
      background: ${color};
      border: 2px solid ${colors.surface};
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${fontSize}px;
      line-height: 1;
    ">${glyph}</div>`,
    iconSize: [dimension, dimension],
    iconAnchor: [dimension / 2, dimension / 2],
  });
}

interface AvatarIconOptions {
  color: string;
  initials: string;
  size?: number;
}

/** Same colored-circle-with-initials look as the native UserMarker. */
export function buildAvatarIcon({ color, initials, size = 28 }: AvatarIconOptions): L.DivIcon {
  return L.divIcon({
    className: "integrate-map-avatar",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 999px;
      background: ${color};
      border: 2px solid ${colors.surface};
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: ${Math.round(size * 0.36)}px;
      font-weight: 600;
      font-family: -apple-system, system-ui, sans-serif;
    ">${initials}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function buildDraftPointIcon(): L.DivIcon {
  return L.divIcon({
    className: "integrate-map-draft-point",
    html: `<div style="
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: ${colors.accent};
      border: 2px solid ${colors.surface};
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}
