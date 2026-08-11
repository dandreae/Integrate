import { useEffect, useState } from "react";
import type { Campus, Place } from "@/types";
import { campusRepository } from "@/services/repositories";
import { expandNicknameAlias, geocodingProvider, toSyntheticPlace } from "@/services/geocoding";

interface UseExternalPlaceSearchResult {
  externalResults: Place[];
  isSearching: boolean;
}

/**
 * Debounced search against the live map/geocoding service (see
 * services/geocoding) — the exact same lookup the main map screen's search
 * bar uses, so any other picker that wants "type a name, get back real
 * buildings on campus, not just Integrate's curated places" gets identical
 * results without re-implementing the debounce/bias/dedupe logic.
 *
 * Biased to the CAMPUS center, not the user's device location — see the
 * identical reasoning in app/(tabs)/index.tsx (the iOS Simulator's default
 * Cupertino, CA location silently zeroed out real Georgetown matches).
 */
export function useExternalPlaceSearch(
  campusId: string,
  query: string,
  curatedPlaces: Place[]
): UseExternalPlaceSearchResult {
  const [campus, setCampus] = useState<Campus | null>(null);
  const [externalResults, setExternalResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    campusRepository.getCampusById(campusId).then((result) => setCampus(result ?? null));
  }, [campusId]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || !campus) {
      setExternalResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const near = { latitude: campus.latitude, longitude: campus.longitude };
    const alias = expandNicknameAlias(trimmed);
    const timeout = setTimeout(async () => {
      const [directResults, aliasResults] = await Promise.all([
        geocodingProvider.search(trimmed, near),
        alias ? geocodingProvider.search(alias, near) : Promise.resolve([]),
      ]);
      if (cancelled) return;

      const curatedNames = new Set(curatedPlaces.map((p) => p.officialName.toLowerCase()));
      const seen = new Set<string>();
      const synthetic = [...directResults, ...aliasResults]
        .filter((r) => {
          const key = r.name.toLowerCase();
          if (curatedNames.has(key) || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((r) => toSyntheticPlace(r, campusId));

      setExternalResults(synthetic);
      setIsSearching(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, campus, campusId, curatedPlaces]);

  return { externalResults, isSearching };
}
