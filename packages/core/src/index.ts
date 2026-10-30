import type { StateStorage } from "zustand/middleware"

import { configureApiClient } from "@workspace/api-client"

import { authTokenStore, useAuthStore } from "./features/auth/store"
import { hydratePreferences, initPreferences } from "./features/preferences/store"
import { initRealtime } from "./features/realtime/socket"
import { setPlatformStorage } from "./lib/storage"

export { createQueryClient } from "./lib/query-client"
export * from "./lib/date"
export * from "./lib/form"
export * from "./lib/number"

export interface SetupOptions {
  apiUrl: string
  /** Platform persistence (web: localStorage, mobile: SecureStore). */
  storage: StateStorage
  /** Device/browser language tag, used when the user has not picked a language. */
  detectLocale: () => string | null | undefined
}

let setupPromise: Promise<void> | undefined

/**
 * One-call bootstrap shared by web and mobile (idempotent): HTTP client, realtime socket,
 * i18n, persisted preferences, then auth. `useAuthStore.hydrated` flips last, so gating UI
 * on it guarantees language and tokens are ready.
 */
export function setupCore({ apiUrl, storage, detectLocale }: SetupOptions) {
  setupPromise ??= (async () => {
    configureApiClient({ baseURL: apiUrl, tokens: authTokenStore })
    initRealtime(apiUrl)
    setPlatformStorage(storage)
    initPreferences(detectLocale)
    await hydratePreferences()
    await useAuthStore.persist.rehydrate()
  })()
  return setupPromise
}
