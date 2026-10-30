import type { ConfigContext, ExpoConfig } from "expo/config"

// Direct file export: app config runs in plain Node, which cannot resolve the theme barrel.
import { hexColors } from "@workspace/theme/colors"

/** Product identity: the only place to rename the app. */
const APP = { name: "Mobile", slug: "mobile", scheme: "mobile", version: "1.0.0" } as const

/**
 * One installable app per variant, so dev, preview and store builds live side by side on a
 * device. The variant is EXPO_PUBLIC_APP_ENV (`.env.development` locally, eas.json per profile).
 */
const VARIANTS = {
  development: { idSuffix: ".dev", nameSuffix: " (Dev)" },
  preview: { idSuffix: ".preview", nameSuffix: " (Preview)" },
  production: { idSuffix: "", nameSuffix: "" },
} as const

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set (see apps/mobile/.env.development, eas.json)`)
  return value
}

const appEnv = requireEnv("EXPO_PUBLIC_APP_ENV")
if (!(appEnv in VARIANTS)) throw new Error(`Unknown EXPO_PUBLIC_APP_ENV: ${appEnv}`)
const variant = VARIANTS[appEnv as keyof typeof VARIANTS]

/** Reverse-DNS store identifier of the production app. */
const appId = `${requireEnv("APP_ID")}${variant.idSuffix}`
/** Set by `eas init`; without it push tokens and OTA updates are disabled. */
const projectId = process.env.EAS_PROJECT_ID

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: `${APP.name}${variant.nameSuffix}`,
  slug: APP.slug,
  version: APP.version,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: `${APP.scheme}${variant.idSuffix.replace(".", "-")}`,
  userInterfaceStyle: "automatic",
  runtimeVersion: { policy: "appVersion" },
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: appId,
    supportsTablet: false,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: appId,
    adaptiveIcon: {
      backgroundColor: hexColors.light.background,
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: "server", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: hexColors.light.background,
        dark: { backgroundColor: hexColors.dark.background },
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
    "expo-secure-store",
    "expo-font",
    "expo-localization",
    "expo-status-bar",
    ["expo-notifications", { color: hexColors.light.primary }],
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location.",
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    // Native crash reporting + source map upload; the upload also needs SENTRY_AUTH_TOKEN
    // (EAS secret). Left out until the project is configured, so builds never fail on it.
    ...(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [
          [
            "@sentry/react-native/expo",
            { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT },
          ] as [string, Record<string, string>],
        ]
      : []),
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  // Over-the-air JS updates per channel (eas.json); a build only accepts updates made for its
  // runtimeVersion, i.e. the same app version.
  updates: projectId
    ? {
        url: `https://u.expo.dev/${projectId}`,
        checkAutomatically: "ON_LOAD",
        fallbackToCacheTimeout: 0,
      }
    : { enabled: false },
  extra: projectId ? { eas: { projectId } } : {},
  ...(projectId ? { owner: process.env.EAS_OWNER } : {}),
})
