import { z } from "zod"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { i18n, resolveLocale, type Locale } from "@workspace/i18n"

import { persistStorage } from "../../lib/storage"

export const THEME_MODES = ["system", "light", "dark"] as const
export type ThemeMode = (typeof THEME_MODES)[number]

interface PreferencesState {
  /** `null` = follow the device/browser language. */
  locale: Locale | null
  theme: ThemeMode
  setLocale: (locale: Locale | null) => void
  setTheme: (theme: ThemeMode) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: null,
      theme: "system",
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "preferences",
      storage: persistStorage,
      partialize: ({ locale, theme }) => ({ locale, theme }),
      skipHydration: true,
    }
  )
)

let detectLocale: () => string | null | undefined = () => null

/** Switch i18n and Zod's built-in messages together. */
function applyLocale(locale: Locale) {
  if (i18n.language !== locale) void i18n.changeLanguage(locale)
  z.config(locale === "vi" ? z.locales.vi() : z.locales.en())
}

const effectiveLocale = (preferred: Locale | null) => preferred ?? resolveLocale(detectLocale())

/** Apply the detected locale now and keep i18n in sync with the store from then on. */
export function initPreferences(detect: () => string | null | undefined) {
  detectLocale = detect
  applyLocale(effectiveLocale(null))
  usePreferencesStore.subscribe((state, prev) => {
    if (state.locale !== prev.locale) applyLocale(effectiveLocale(state.locale))
  })
}

export async function hydratePreferences() {
  await usePreferencesStore.persist.rehydrate()
  applyLocale(effectiveLocale(usePreferencesStore.getState().locale))
}
