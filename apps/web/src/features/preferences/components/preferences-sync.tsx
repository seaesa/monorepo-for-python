"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

import { useLocale, usePreferencesStore } from "@workspace/core/preferences"

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SECONDS } from "@/config"

/** Applies shared preferences to web-only mechanisms: next-themes, <html lang>, locale cookie. */
export function PreferencesSync() {
  const theme = usePreferencesStore((s) => s.theme)
  const locale = useLocale()
  const { setTheme } = useTheme()

  useEffect(() => setTheme(theme), [theme, setTheme])

  useEffect(() => {
    document.documentElement.lang = locale
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
  }, [locale])

  return null
}
