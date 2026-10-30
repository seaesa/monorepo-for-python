"use client"

import { THEME_MODES, useLocale, usePreferencesStore } from "@workspace/core/preferences"
import { SUPPORTED_LOCALES, useTranslation, type Locale } from "@workspace/i18n"

import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

/** Language + theme radio groups, rendered inside any DropdownMenuContent. */
export function PreferencesMenuItems() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { theme, setLocale, setTheme } = usePreferencesStore()

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={(v) => setLocale(v as Locale)}>
          {SUPPORTED_LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l} value={l}>
              {t(`languages.${l}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
      <DropdownMenuGroup>
        <DropdownMenuLabel>{t("settings.theme")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
          {THEME_MODES.map((mode) => (
            <DropdownMenuRadioItem key={mode} value={mode}>
              {t(`settings.themes.${mode}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
    </>
  )
}
