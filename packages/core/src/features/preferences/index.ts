import { useTranslation, type Locale } from "@workspace/i18n"

export { THEME_MODES, usePreferencesStore, type ThemeMode } from "./store"

/** The locale currently rendered (preference or detected). Re-renders on change. */
export function useLocale(): Locale {
  return useTranslation().i18n.language as Locale
}
