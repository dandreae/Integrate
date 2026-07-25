import type { LatLng, Place } from "@/types";

/**
 * NATURAL LANGUAGE INTENTS
 * ------------------------
 * A small, local, deterministic mapping from conversational campus queries
 * ("quiet study", "wheelchair entrance", "where should I eat") to a
 * filter + a checklist of reasons — no external NLP involved. Each intent
 * recognizes a query shape and, for a given place, either says "doesn't
 * apply" (null) or returns the ordered list of reasons it's a good match,
 * which the UI renders as a "Matched because ✓ ..." card.
 */

export interface IntentContext {
  userLocation?: LatLng | null;
}

export interface IntentDefinition {
  id: string;
  test: (normalizedQuery: string) => boolean;
  evaluate: (place: Place, context: IntentContext) => string[] | null;
}

const LATE_NIGHT_PATTERN = /midnight|24 hours?|\b1am\b|\b2am\b|\b3am\b/i;

function isOpenLate(place: Place): boolean {
  return LATE_NIGHT_PATTERN.test(place.openingHours.summary);
}

function hasAccessibleEntrance(place: Place): boolean {
  return place.entrances.some((entrance) => entrance.isAccessible);
}

const INTENTS: IntentDefinition[] = [
  {
    id: "best-coffee",
    test: (q) => /\b(best|good|great|nice)\b/.test(q) && /coffee|cafe|café/.test(q),
    evaluate: (place) => {
      if (place.category !== "coffee") return null;
      const reasons = ["Coffee shop"];
      if (place.confidenceLevel === "high") reasons.push("Well-reviewed by students");
      if (place.studentTips.length > 0) reasons.push("Student favorite");
      return reasons;
    },
  },
  {
    id: "late-night-food",
    test: (q) => /late.?night/.test(q) && /food|eat|dining|snack/.test(q),
    evaluate: (place) => {
      if (place.category !== "dining" && place.category !== "coffee") return null;
      if (!isOpenLate(place)) return null;
      return ["Open late", place.category === "coffee" ? "Coffee" : "Dining"];
    },
  },
  {
    id: "quiet-study",
    test: (q) => /quiet/.test(q) && /study|studying|work|homework/.test(q),
    evaluate: (place) => {
      if (place.category !== "study") return null;
      const reasons = ["Quiet study space"];
      if (place.quietHours) reasons.push(`Quietest: ${place.quietHours}`);
      return reasons;
    },
  },
  {
    id: "closest-bathroom",
    test: (q) => /bathroom|restroom|toilet/.test(q),
    evaluate: (place) => {
      if (!place.accessibilityFeatures.includes("accessible-restroom")) return null;
      return ["Accessible restroom on site"];
    },
  },
  {
    id: "where-to-eat",
    test: (q) => /where.*(should i eat|to eat)|where.*eat/.test(q),
    evaluate: (place) => {
      if (place.category !== "dining") return null;
      const reasons = ["Dining"];
      if (place.studentTips.length > 0) reasons.push("Student favorite");
      return reasons;
    },
  },
  {
    id: "freshman-classes",
    test: (q) => /freshman|first.?year/.test(q) && /class|classes|academic|building/.test(q),
    evaluate: (place) => {
      if (place.category !== "academic") return null;
      const reasons = ["Academic building"];
      if (place.firstYearTips.length > 0) reasons.push("Popular with first-years");
      return reasons;
    },
  },
  {
    id: "wheelchair-entrance",
    test: (q) => /wheelchair/.test(q) || (/accessible/.test(q) && /entrance|access/.test(q)),
    evaluate: (place) => {
      if (!hasAccessibleEntrance(place)) return null;
      const accessibleEntrance = place.entrances.find((entrance) => entrance.isAccessible);
      return accessibleEntrance
        ? [`Accessible via "${accessibleEntrance.label}"`]
        : ["Accessible entrance available"];
    },
  },
];

export function findMatchingIntent(normalizedQuery: string): IntentDefinition | null {
  return INTENTS.find((intent) => intent.test(normalizedQuery)) ?? null;
}
