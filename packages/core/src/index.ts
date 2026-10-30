import type { StateStorage } from "zustand/middleware"

import { configureApiClient } from "@workspace/api-client"

import { markAppUpdateRequired } from "./features/app-update/store"
import { authTokenStore, useAuthStore } from "./features/auth/store"
import { hydratePreferences, initPreferences } from "./features/preferences/store"
import { setPlatformStorage } from "./lib/storage"
import { initRealtime } from "./realtime/socket"

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
  /** Sent with every API request (mobile: `X-App-Version`, enables the forced-update gate). */
  headers?: Record<string, string>
}

let setupPromise: Promise<void> | undefined

/**
 * One-call bootstrap shared by web and mobile (idempotent): HTTP client, realtime socket,
 * i18n, persisted preferences, then auth. `useAuthStore.hydrated` flips last, so gating UI
 * on it guarantees language and tokens are ready.
 */
export function setupCore({ apiUrl, storage, detectLocale, headers }: SetupOptions) {
  setupPromise ??= (async () => {
    configureApiClient({
      baseURL: apiUrl,
      tokens: authTokenStore,
      headers,
      onError: (error) => {
        if (error.code === "app_update_required") markAppUpdateRequired()
      },
    })
    initRealtime(apiUrl)
    setPlatformStorage(storage)
    initPreferences(detectLocale)
    await hydratePreferences()
    await useAuthStore.persist.rehydrate()
  })()
  return setupPromise
}
