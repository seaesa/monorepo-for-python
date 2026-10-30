/**
 * Design tokens — the single source of truth for web and mobile.
 *
 * Edit this file, then run `pnpm theme` (repo root). Never edit `src/generated/*`.
 * Values are the shadcn "maia" neutral palette in oklch. Token names follow the
 * shadcn convention so `bg-background`, `text-muted-foreground`, … work on both
 * platforms and new shadcn / React Native Reusables components pick them up.
 */

export const colors = {
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0 0)",
    chart1: "oklch(0.87 0 0)",
    chart2: "oklch(0.556 0 0)",
    chart3: "oklch(0.439 0 0)",
    chart4: "oklch(0.371 0 0)",
    chart5: "oklch(0.269 0 0)",
    sidebar: "oklch(0.985 0 0)",
    sidebarForeground: "oklch(0.145 0 0)",
    sidebarPrimary: "oklch(0.205 0 0)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.97 0 0)",
    sidebarAccentForeground: "oklch(0.205 0 0)",
    sidebarBorder: "oklch(0.922 0 0)",
    sidebarRing: "oklch(0.708 0 0)",
  },
  dark: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    popover: "oklch(0.205 0 0)",
    popoverForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.922 0 0)",
    primaryForeground: "oklch(0.205 0 0)",
    secondary: "oklch(0.269 0 0)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    mutedForeground: "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    accentForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.704 0.191 22.216)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 15%)",
    ring: "oklch(0.556 0 0)",
    chart1: "oklch(0.87 0 0)",
    chart2: "oklch(0.556 0 0)",
    chart3: "oklch(0.439 0 0)",
    chart4: "oklch(0.371 0 0)",
    chart5: "oklch(0.269 0 0)",
    sidebar: "oklch(0.205 0 0)",
    sidebarForeground: "oklch(0.985 0 0)",
    sidebarPrimary: "oklch(0.488 0.243 264.376)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.269 0 0)",
    sidebarAccentForeground: "oklch(0.985 0 0)",
    sidebarBorder: "oklch(1 0 0 / 10%)",
    sidebarRing: "oklch(0.556 0 0)",
  },
} as const

/** Base radius in rem; the scale below multiplies it (shadcn maia scale). */
export const radius = 0.625

export const radiusScale = {
  sm: 0.6,
  md: 0.8,
  lg: 1,
  xl: 1.4,
  "2xl": 1.8,
  "3xl": 2.2,
  "4xl": 2.6,
} as const

/**
 * Font family — must support Vietnamese (Figtree, the maia default, does not).
 * Web loads it with `next/font` (Be_Vietnam_Pro), mobile with expo-font `fontDefinitions`
 * under this exact family name so `font-medium` etc. map to real weights natively.
 * Weights shipped on both: 400, 500, 600, 700.
 */
export const fontFamily = { sans: "Be Vietnam Pro" } as const

export type ColorScheme = keyof typeof colors
export type ColorToken = keyof (typeof colors)["light"]
