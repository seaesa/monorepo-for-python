"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

import { useLocale, usePreferencesStore } from "@workspace/core/preferences"

import { LOCALE_COOKIE } from "@/lib/i18n-constants"

/** Applies shared preferences to web-only mechanisms: next-themes, <html lang>, locale cookie. */
export function PreferencesSync() {
  const theme = usePreferencesStore((s) => s.theme)
  const locale = useLocale()
  const { setTheme } = useTheme()

  useEffect(() => setTheme(theme), [theme, setTheme])

  useEffect(() => {
    document.documentElement.lang = locale
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
  }, [locale])

  return null
}
