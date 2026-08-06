/**
 * Verified student nicknames/abbreviations that the map service's own text
 * search won't resolve (checked directly against OpenStreetMap's tags —
 * e.g. Georgetown's "ICC" has no short_name/alt_name in OSM, it's pure
 * institutional tradition, not derivable from the building's real name).
 *
 * This only ever expands search TEXT before it hits the real geocoder — the
 * resulting coordinate always comes from live map data, never a hardcoded
 * location. Add entries here only when you've verified the expansion
 * actually resolves to the right place (see services/geocoding/index.ts).
 */
export const CAMPUS_NICKNAME_ALIASES: Record<string, string> = {
  icc: "Intercultural Center",
};

/** Case/whitespace-insensitive lookup. Returns null if the query isn't a known nickname. */
export function expandNicknameAlias(query: string): string | null {
  return CAMPUS_NICKNAME_ALIASES[query.trim().toLowerCase()] ?? null;
}
