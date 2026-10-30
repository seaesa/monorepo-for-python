import * as Application from "expo-application"
import { getLocales } from "expo-localization"

import { setupCore } from "@workspace/core"

import { env } from "./env"
import { initMonitoring } from "./monitoring"
import { configureNotifications } from "./notifications"
import { secureStorage } from "./storage"

export function setupApp() {
  initMonitoring()
  configureNotifications()
  return setupCore({
    apiUrl: env.EXPO_PUBLIC_API_URL,
    storage: secureStorage,
    detectLocale: () => getLocales()[0]?.languageTag,
    // Lets the API refuse builds older than `MIN_APP_VERSION` (forced update).
    headers: Application.nativeApplicationVersion
      ? { "X-App-Version": Application.nativeApplicationVersion }
      : undefined,
  })
}
