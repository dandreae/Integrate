import { useCallback, useState } from "react";
import * as Location from "expo-location";
import type { LatLng } from "@/types";

interface RequestLocationOptions {
  /** Skip the isLocating indicator — for best-effort background lookups (e.g. distance display) that shouldn't flash UI. */
  silent?: boolean;
}

interface UseCurrentLocationResult {
  requestLocation: (options?: RequestLocationOptions) => Promise<LatLng | null>;
  isLocating: boolean;
  permissionDenied: boolean;
}

/**
 * Requests foreground location permission on demand (not on mount) and
 * returns the current coordinate. Used by the map screen's locate-me button,
 * and (in silent mode) by any screen that wants a best-effort distance figure.
 */
export function useCurrentLocation(): UseCurrentLocationResult {
  const [isLocating, setIsLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(
    async (options?: RequestLocationOptions): Promise<LatLng | null> => {
      if (!options?.silent) setIsLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setPermissionDenied(true);
          return null;
        }
        setPermissionDenied(false);
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch {
        return null;
      } finally {
        if (!options?.silent) setIsLocating(false);
      }
    },
    []
  );

  return { requestLocation, isLocating, permissionDenied };
}
