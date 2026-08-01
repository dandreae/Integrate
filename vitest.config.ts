import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Covers the pure routing/scoring logic under services/routing and
 * services/repositories. Deliberately node-environment, not jest-expo —
 * none of that logic touches React Native, so a full RN test environment
 * would only add setup cost without covering anything real.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    exclude: ["node_modules", ".expo"],
  },
});
