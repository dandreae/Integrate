import type { Persistence, ReactNativeAsyncStorage } from "firebase/auth";

/**
 * The `firebase` npm wrapper's public typings for `firebase/auth` are built
 * from a cross-platform surface that omits `getReactNativePersistence` —
 * it only exists in @firebase/auth's React Native build, which Metro
 * resolves correctly at runtime but which TypeScript's package-exports
 * resolution doesn't reach (the wrapper's "./auth" export has no
 * "react-native" condition). This augmentation adds the real, documented
 * signature back so services/firebase.ts type-checks without a workaround.
 */
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
