import i18next, { type i18n as I18n } from "i18next"
import { initReactI18next } from "react-i18next"

import { en } from "./locales/en"
import { vi } from "./locales/vi"

export type { Messages } from "./types"

export const SUPPORTED_LOCALES = ["vi", "en"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "vi"

export const resources = {
  en: { translation: en },
  vi: { translation: vi },
} as const

declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof en }
  }
}

/** Map any BCP-47 tag ("vi-VN", "en-US", …) to a supported locale. */
export function resolveLocale(tag: string | null | undefined): Locale {
  const base = tag?.toLowerCase().split(/[-_]/)[0]
  return SUPPORTED_LOCALES.find((l) => l === base) ?? DEFAULT_LOCALE
}

/**
 * The app-wide i18next instance (one per JS runtime). Resources are bundled, so init is
 * synchronous and `t` works on the very first render. Server code must not call
 * `changeLanguage`; use `i18n.getFixedT(locale)` instead.
 */
export const i18n: I18n = i18next.createInstance()

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: "en",
  supportedLngs: SUPPORTED_LOCALES,
  initAsync: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
})

/**
 * Translate a message that may be an i18n key (custom schema messages, `errors.<code>`)
 * or already-final text (Zod built-in messages, server messages). Keys are translated,
 * anything else is returned unchanged.
 */
/**
 * `t` for keys only known at runtime (server error codes, Zod messages). The typed overloads of
 * `t` reject a plain string, so this is the single place that widens it. Missing key → undefined.
 */
export function translateKey(key: string, params?: object): string | undefined {
  if (!i18n.exists(key)) return undefined
  return (i18n.t as unknown as (key: string, options?: object) => string)(key, params)
}

export function translateMessage(message: string | undefined): string | undefined {
  if (!message) return message
  return translateKey(message) ?? message
}

export { useTranslation } from "react-i18next"
