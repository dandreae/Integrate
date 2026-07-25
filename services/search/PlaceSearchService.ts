import type { LatLng, Place } from "@/types";
import { haversineDistanceMeters } from "@/features/routing/geo";
import { findMatchingIntent, type IntentContext } from "./naturalLanguageIntents";

/**
 * PLACE SEARCH SERVICE
 * --------------------
 * A lightweight, local, deterministic ranking function over the mocked place
 * data — no external search/NLP service involved. It scores each place
 * across several match categories (exact alias, partial name, category,
 * tips, description) and reports the single best-matching reason for
 * display, while summing all matching categories' scores for ranking so a
 * place that matches in multiple ways ranks above one that only barely
 * matches in one way.
 *
 * A special "<keyword> near <landmark>" pattern (e.g. "coffee near library")
 * is parsed separately: it resolves the landmark by text match, then ranks
 * remaining places by a mix of keyword relevance and proximity to it.
 */

export interface PlaceSearchResult {
  place: Place;
  score: number;
  /** Human-readable reason for the match, e.g. "Matched local name". Empty string for an unranked (empty-query) result. */
  matchReason: string;
  /** Ordered "Matched because ✓ ..." checklist, set only for recognized natural-language intent queries. */
  matchReasons?: string[];
}

const NEAR_QUERY_PATTERN = /^(.*?)\bnear\b\s+(.+)$/;
const NEAR_SEARCH_RADIUS_METERS = 250;

interface MatchCandidate {
  score: number;
  reason: string;
}

function matchPlace(normalizedQuery: string, place: Place): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  const localNameNorm = place.localName?.toLowerCase();
  const officialNameNorm = place.officialName.toLowerCase();
  const aliasesNorm = place.aliases.map((alias) => alias.toLowerCase());
  // Match against the raw category key ("study"), not the display label
  // ("Study spaces") — the label can be multiple words, which would never
  // appear as a substring of a short one-word query like "study".
  const categoryKeyNorm = place.category.toLowerCase();

  const exactAliasMatch = aliasesNorm.includes(normalizedQuery);
  const exactLocalNameMatch = localNameNorm === normalizedQuery;
  if (exactAliasMatch || exactLocalNameMatch) {
    candidates.push({
      score: 100,
      reason: exactAliasMatch ? "Matched abbreviation" : "Matched local name",
    });
  }

  if (aliasesNorm.some((alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias))) {
    candidates.push({ score: 75, reason: "Matched abbreviation" });
  }

  if (
    localNameNorm &&
    (localNameNorm.includes(normalizedQuery) || normalizedQuery.includes(localNameNorm))
  ) {
    candidates.push({ score: 70, reason: "Matched local name" });
  }

  if (officialNameNorm.includes(normalizedQuery)) {
    candidates.push({ score: 60, reason: "Matched official name" });
  }

  if (normalizedQuery.includes(categoryKeyNorm)) {
    candidates.push({ score: 50, reason: "Matched category" });
  }

  const allTips = [...place.studentTips, ...place.navigationTips, ...place.firstYearTips];
  if (allTips.some((tip) => tip.toLowerCase().includes(normalizedQuery))) {
    candidates.push({ score: 40, reason: "Matched student tip" });
  }

  if (place.description.toLowerCase().includes(normalizedQuery)) {
    candidates.push({ score: 20, reason: "Matched description" });
  }

  return candidates;
}

function rankPlaces(normalizedQuery: string, places: Place[]): PlaceSearchResult[] {
  const scored: PlaceSearchResult[] = [];

  for (const place of places) {
    const candidates = matchPlace(normalizedQuery, place);
    if (candidates.length === 0) continue;

    const totalScore = candidates.reduce((sum, candidate) => sum + candidate.score, 0);
    const bestCandidate = candidates.reduce((best, candidate) =>
      candidate.score > best.score ? candidate : best
    );
    scored.push({ place, score: totalScore, matchReason: bestCandidate.reason });
  }

  return scored.sort((a, b) => b.score - a.score);
}

function searchNear(keywordPhrase: string, landmarkPhrase: string, places: Place[]): PlaceSearchResult[] {
  const landmarkMatches = rankPlaces(landmarkPhrase, places);
  const landmark = landmarkMatches[0]?.place;
  if (!landmark) return [];

  const results: PlaceSearchResult[] = [];

  for (const place of places) {
    if (place.id === landmark.id) continue;

    const distanceMeters = haversineDistanceMeters(
      { latitude: landmark.latitude, longitude: landmark.longitude },
      { latitude: place.latitude, longitude: place.longitude }
    );
    if (distanceMeters > NEAR_SEARCH_RADIUS_METERS) continue;

    const keywordCandidates = keywordPhrase ? matchPlace(keywordPhrase, place) : [];
    if (keywordPhrase && keywordCandidates.length === 0) continue;

    const keywordScore = keywordCandidates.reduce((sum, candidate) => sum + candidate.score, 0);
    const proximityBonus = Math.round(30 * (1 - distanceMeters / NEAR_SEARCH_RADIUS_METERS));

    results.push({
      place,
      score: 50 + keywordScore + proximityBonus,
      matchReason: `Near ${landmark.officialName}`,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

function sortByProximityIfAvailable(
  results: PlaceSearchResult[],
  userLocation?: LatLng | null
): PlaceSearchResult[] {
  if (!userLocation) return results;
  return [...results].sort((a, b) => {
    const distanceA = haversineDistanceMeters(userLocation, {
      latitude: a.place.latitude,
      longitude: a.place.longitude,
    });
    const distanceB = haversineDistanceMeters(userLocation, {
      latitude: b.place.latitude,
      longitude: b.place.longitude,
    });
    return distanceA - distanceB;
  });
}

const NEARBY_INTENT_RADIUS_METERS = 300;

function searchIntent(
  normalizedQuery: string,
  places: Place[],
  context: IntentContext
): PlaceSearchResult[] {
  const intent = findMatchingIntent(normalizedQuery);
  if (!intent) return [];

  const results: PlaceSearchResult[] = [];
  for (const place of places) {
    const reasons = intent.evaluate(place, context);
    if (!reasons) continue;

    const allReasons = [...reasons];
    if (context.userLocation) {
      const distanceMeters = haversineDistanceMeters(context.userLocation, {
        latitude: place.latitude,
        longitude: place.longitude,
      });
      if (distanceMeters <= NEARBY_INTENT_RADIUS_METERS) {
        allReasons.push("Nearby");
      }
    }

    results.push({ place, score: 100, matchReason: allReasons[0], matchReasons: allReasons });
  }

  return sortByProximityIfAvailable(results, context.userLocation);
}

export function searchPlaces(
  query: string,
  places: Place[],
  context: IntentContext = {}
): PlaceSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return places.map((place) => ({ place, score: 0, matchReason: "" }));
  }

  const intentResults = searchIntent(normalizedQuery, places, context);
  if (intentResults.length > 0) return intentResults;

  const nearMatch = normalizedQuery.match(NEAR_QUERY_PATTERN);
  if (nearMatch) {
    const keywordPhrase = nearMatch[1].trim();
    const landmarkPhrase = nearMatch[2].trim();
    const nearResults = searchNear(keywordPhrase, landmarkPhrase, places);
    if (nearResults.length > 0) return nearResults;
    // Landmark couldn't be resolved or nothing was nearby — fall back to plain matching below.
  }

  return rankPlaces(normalizedQuery, places);
}
