import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { ConstructionZone } from "@/types";

/** Approved (post 10-confirmation) community-reported zones, live from Firestore. */
export function subscribeToApprovedConstructionZones(
  campusId: string,
  onChange: (zones: ConstructionZone[]) => void
) {
  const q = query(collection(db, "constructionZones"), where("campusId", "==", campusId));
  return onSnapshot(q, (snapshot) => {
    const zones: ConstructionZone[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        campusId: data.campusId,
        title: data.title,
        description: data.description,
        coordinates: data.coordinates,
        severity: data.severity,
        startDate: data.startDate,
        endDate: data.endDate,
        affectedAccessibility: data.affectedAccessibility,
      };
    });
    onChange(zones);
  });
}

/** Merges static seed zones with live approved zones, de-duplicating by id. */
export function mergeConstructionZones(
  seedZones: ConstructionZone[],
  liveZones: ConstructionZone[]
): ConstructionZone[] {
  const byId = new Map(seedZones.map((zone) => [zone.id, zone]));
  for (const zone of liveZones) {
    byId.set(zone.id, zone);
  }
  return Array.from(byId.values());
}
