import { useEffect, useState } from "react";
import type { PlaceOverride } from "@/types";
import { subscribeToPlaceOverrides } from "@/services/repositories/firestore/placeOverridesRepository";

/** Live map of placeId -> approved community rename, applied on top of static place data. */
export function usePlaceOverrides(): Map<string, PlaceOverride> {
  const [overrides, setOverrides] = useState<Map<string, PlaceOverride>>(new Map());

  useEffect(() => {
    return subscribeToPlaceOverrides(setOverrides);
  }, []);

  return overrides;
}
