const { getDefaultConfig } = require("expo/metro-config")
const { withUniwindConfig } = require("uniwind/metro")

// Monorepo resolution is automatic (SDK 52+); do not add watchFolders/nodeModulesPaths.
const config = getDefaultConfig(__dirname)

// withUniwindConfig must stay the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
  polyfills: { rem: 16 },
})
