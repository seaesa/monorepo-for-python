/** Web-only constants. Shared tunables live in `@workspace/core` config; env in `lib/env.ts`. */

/** Locale cookie, read by the server (i18n-server.ts) and written by PreferencesSync. */
export const LOCALE_COOKIE = "locale"
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
