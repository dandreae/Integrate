/**
 * Design tokens for Integrate.
 * Warm neutral, map-first palette with one campus accent and one restrained
 * accessibility accent. Kept flat (no theming system) since the MVP targets
 * a single light, high-contrast look tuned for outdoor/walking use.
 */

export const colors = {
  background: "#FAF7F2",
  surface: "#FFFFFF",
  surfaceMuted: "#F1ECE2",
  border: "#E4DDCF",

  textPrimary: "#2A2622",
  textSecondary: "#635C50",
  textInverse: "#FFFFFF",

  /** Campus accent — Georgetown-inspired deep blue. Drives primary actions, active states. */
  accent: "#0B2E59",
  accentMuted: "#E6EBF2",

  /** Restrained accessibility color — used only for accessibility info/badges. */
  accessible: "#3E7A5E",
  accessibleMuted: "#E5F0EA",

  /** Status colors — never the sole indicator of meaning; always paired with icon/text. */
  warning: "#B5651D",
  warningMuted: "#F5E9DD",
  danger: "#A3342A",
  dangerMuted: "#F5E1DE",

  overlay: "rgba(42, 38, 34, 0.4)",
} as const;

export const categoryColors: Record<string, string> = {
  academic: "#3B5FE0",
  dining: "#E0304F",
  coffee: "#8B5A2B",
  study: "#7A5CE0",
  landmark: "#E0A72E",
  grocery: "#4FAE32",
  parking: "#5B7C99",
  resource: "#1FA97A",
  gathering: "#C23F9C",
  construction: "#F2843D",
  accessible: "#22A6B3",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "500" as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16 },
};

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const touchTarget = {
  minimum: 44,
} as const;
