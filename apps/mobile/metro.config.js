const { getSentryExpoConfig } = require("@sentry/react-native/metro")
const { withUniwindConfig } = require("uniwind/metro")

// Monorepo resolution is automatic (SDK 52+); do not add watchFolders/nodeModulesPaths.
// Sentry's wrapper = Expo's default config + debug ids for source maps.
const config = getSentryExpoConfig(__dirname)

// withUniwindConfig must stay the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
  polyfills: { rem: 16 },
})
