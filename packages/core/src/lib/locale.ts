import { i18n } from "@workspace/i18n"

/**
 * Header for endpoints that localize the email they send (verification, reset).
 * The API resolves the locale from `Accept-Language` and falls back to English.
 */
export function acceptLanguage(): Record<string, string> {
  return { "Accept-Language": i18n.language }
}
