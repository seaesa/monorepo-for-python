import { DarkTheme, DefaultTheme, type Theme } from "expo-router"

import { hexColors } from "@workspace/theme"

/** React Navigation theme built from the shared tokens (navigation cannot read CSS vars). */
const navTheme = (base: Theme, colors: (typeof hexColors)["light" | "dark"]): Theme => ({
  ...base,
  colors: {
    background: colors.background,
    border: colors.border,
    card: colors.card,
    notification: colors.destructive,
    primary: colors.primary,
    text: colors.foreground,
  },
})

export const NAV_THEME = {
  light: navTheme(DefaultTheme, hexColors.light),
  dark: navTheme(DarkTheme, hexColors.dark),
}
