import { getLocales } from "expo-localization"

import { setupCore } from "@workspace/core"

import { env } from "./env"
import { secureStorage } from "./storage"

export function setupApp() {
  return setupCore({
    apiUrl: env.EXPO_PUBLIC_API_URL,
    storage: secureStorage,
    detectLocale: () => getLocales()[0]?.languageTag,
  })
}
