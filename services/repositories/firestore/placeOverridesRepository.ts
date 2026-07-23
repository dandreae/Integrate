import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Place, PlaceOverride } from "@/types";

export function subscribeToPlaceOverrides(
  onChange: (overridesByPlaceId: Map<string, PlaceOverride>) => void
) {
  return onSnapshot(collection(db, "placeOverrides"), (snapshot) => {
    const overrides = new Map<string, PlaceOverride>();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      overrides.set(docSnap.id, {
        placeId: docSnap.id,
        proposedOfficialName: data.proposedOfficialName,
        proposedLocalName: data.proposedLocalName,
        approvedAt: data.approvedAt?.toMillis?.() ?? Date.now(),
        sourceProposalId: data.sourceProposalId,
      });
    });
    onChange(overrides);
  });
}

export function applyPlaceOverride(place: Place, override: PlaceOverride | undefined): Place {
  if (!override) return place;
  return {
    ...place,
    officialName: override.proposedOfficialName ?? place.officialName,
    localName: override.proposedLocalName ?? place.localName,
  };
}
