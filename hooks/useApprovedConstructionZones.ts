import { useEffect, useState } from "react";
import type { ConstructionZone } from "@/types";
import {
  mergeConstructionZones,
  subscribeToApprovedConstructionZones,
} from "@/services/repositories/firestore/constructionZonesRepository";

/** Merges the static seed construction zones with live, community-approved ones. */
export function useApprovedConstructionZones(
  campusId: string,
  seedZones: ConstructionZone[]
): ConstructionZone[] {
  const [liveZones, setLiveZones] = useState<ConstructionZone[]>([]);

  useEffect(() => {
    return subscribeToApprovedConstructionZones(campusId, setLiveZones);
  }, [campusId]);

  return mergeConstructionZones(seedZones, liveZones);
}
