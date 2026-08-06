const STOPWORDS = new Set(["the", "of", "and", "at", "for", "de", "la", "&"]);

/** A query "looks like" an abbreviation if it's short, letters-only, and has no spaces. */
export function looksLikeAbbreviation(query: string): boolean {
  return /^[A-Za-z]{2,6}$/.test(query.trim());
}

function significantWords(name: string): string[] {
  return name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ""))
    .filter((w) => w.length > 0 && !STOPWORDS.has(w.toLowerCase()));
}

function initialsOf(words: string[]): string {
  return words.map((w) => w[0]).join("").toUpperCase();
}

/**
 * Building names are often "Donor Name + Descriptive Name" (e.g. "Bunn
 * Intercultural Center") or end in a generic suffix ("... Hall", "...
 * Building") that students drop when abbreviating. Trying the initials with
 * the first and/or last word removed catches both without needing to know
 * which pattern applies to a given building.
 */
function initialsVariants(name: string): string[] {
  const words = significantWords(name);
  if (words.length < 2) return [initialsOf(words)];
  const variants = new Set<string>([
    initialsOf(words),
    initialsOf(words.slice(1)),
    initialsOf(words.slice(0, -1)),
  ]);
  return [...variants].filter((v) => v.length >= 2);
}

/** Collapses consecutive repeated letters: "ICC" -> "IC", "AABB" -> "AB". */
function collapseRepeats(s: string): string {
  return s.replace(/(.)\1+/g, "$1");
}

/**
 * Best-effort, general (not per-building-hardcoded) guess at whether `query`
 * could be a colloquial abbreviation of `name`, derived purely from the
 * name's own words. Deliberately conservative — exact-initials or
 * exact-initials-after-collapsing-doubled-letters only, no fuzzy edit
 * distance — false positives on a navigation app are worse than a missed
 * match, so callers must present this as an unconfirmed guess, not a result.
 */
export function matchesAbbreviation(query: string, name: string): boolean {
  if (!looksLikeAbbreviation(query)) return false;
  const normalizedQuery = query.trim().toUpperCase();
  const collapsedQuery = collapseRepeats(normalizedQuery);

  return initialsVariants(name).some(
    (initials) => initials === normalizedQuery || initials === collapsedQuery
  );
}
