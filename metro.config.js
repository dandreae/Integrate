// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Web-only fix: some dependencies (e.g. zustand's middleware) ship an ESM
// build that uses `import.meta.env`, which Metro's non-module web entry
// script can't parse ("Cannot use 'import.meta' outside a module"). Forcing
// resolution to prefer "require"/"react-native" package.json export
// conditions over "import" makes Metro pick each package's CJS build
// instead. Native platforms are unaffected — react-native/iOS/Android
// builds already resolve via the "react-native" condition regardless of
// whether "import" is in this list.
config.resolver.unstable_conditionNames = ["require", "react-native"];

module.exports = config;
