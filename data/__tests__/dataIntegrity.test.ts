import { CONSTRUCTION_ZONES, PLACES } from "@/data";
import { findAffectedEntrances } from "@/features/conditions/affectedEntrances";
import { isDataOutdated } from "@/features/places/dataTrust";
import { findNearbyPlaces } from "@/services/proximity";

/**
 * Sanity checks against the real mock dataset — not just isolated fixtures —
 * so a future data edit that accidentally breaks one of the phase's headline
 * demo scenarios (a construction zone with no affected entrances, no
 * outdated places to show the data-trust UI, a place with no nearby
 * results) fails loudly here instead of only being noticed manually.
 */
describe("real campus data integrity", () => {
  it("every construction zone finds at least one plausibly affected entrance", () => {
    for (const zone of CONSTRUCTION_ZONES) {
      const affected = findAffectedEntrances(zone, PLACES);
      expect(affected.length).toBeGreaterThan(0);
    }
  });

  it("has at least one place whose data is outdated, for the data-trust UI to demonstrate", () => {
    const outdatedPlaces = PLACES.filter((place) => isDataOutdated(place.dataLastVerifiedAt));
    expect(outdatedPlaces.length).toBeGreaterThan(0);
  });

  it("has at least one recently-verified place, so 'Verified' also has something to show", () => {
    const freshPlaces = PLACES.filter((place) => !isDataOutdated(place.dataLastVerifiedAt));
    expect(freshPlaces.length).toBeGreaterThan(0);
  });

  it("finds diverse nearby places for a well-connected campus building", () => {
    const healyHall = PLACES.find((place) => place.id === "healy-hall");
    expect(healyHall).toBeTruthy();

    const nearby = findNearbyPlaces(healyHall!, PLACES, {
      limit: 4,
      curatedIds: healyHall!.nearbyPlaceIds,
    });
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby.every((result) => result.place.id !== healyHall!.id)).toBe(true);
  });

  it("every place has at least one alias, local name, or clear official name to search by", () => {
    for (const place of PLACES) {
      const hasSearchableName = Boolean(place.localName) || place.aliases.length > 0 || place.officialName.length > 0;
      expect(hasSearchableName).toBe(true);
    }
  });
});
