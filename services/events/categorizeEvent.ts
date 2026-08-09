import type { EventCategory } from "@/types";

/**
 * Best-effort keyword classifier for events whose source doesn't give a
 * usable category/tag list (Georgetown's LiveWhale feed usually doesn't).
 * Deliberately conservative, same philosophy as
 * services/geocoding/abbreviationMatch.ts — checked in a fixed priority
 * order so a title matching multiple keywords still gets one predictable
 * category, falling back to "other" rather than guessing wrong.
 */
const CATEGORY_PATTERNS: [EventCategory, RegExp][] = [
  ["sports", /\b(game|match|tournament|athletics?|basketball|football|soccer|lacrosse|volleyball|hoyas?)\b/i],
  ["concert", /\b(concert|recital|music(al)?|orchestra|choir|band performance)\b/i],
  ["market", /\b(market|fair|farmers)\b/i],
  [
    "academic",
    /\b(lecture|seminar|colloquium|symposium|workshop|conference|panel|thesis|dissertation|info session)\b/i,
  ],
  ["meeting", /\b(meeting|town hall|orientation|open house)\b/i],
  ["social", /\b(social|mixer|party|reception|celebration|gala|tailgate)\b/i],
];

/** `tags`/`event_types` from the source, when present, are checked alongside the title. */
export function categorizeEvent(title: string, tags: string[] = []): EventCategory {
  const haystack = [title, ...tags].join(" ");
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(haystack)) return category;
  }
  return "other";
}
