import "@/lib/polyfills"
import "@/global.css"

import { PortalHost } from "@rn-primitives/portal"
import { useFonts } from "expo-font"
import { Stack, ThemeProvider } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { Uniwind, useUniwind } from "uniwind"

import { useAuthStore } from "@workspace/core/auth"
import { usePreferencesStore } from "@workspace/core/preferences"

import { Providers } from "@/components/providers"
import { FONTS } from "@/lib/fonts"
import { setupApp } from "@/lib/setup"
import { NAV_THEME } from "@/lib/theme"

void SplashScreen.preventAutoHideAsync()
void setupApp()

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS)
  const { theme } = useUniwind()
  const themeMode = usePreferencesStore((s) => s.theme)
  const hydrated = useAuthStore((s) => s.hydrated)
  const isAuthenticated = useAuthStore((s) => !!s.accessToken)
  const ready = hydrated && fontsLoaded

  useEffect(() => Uniwind.setTheme(themeMode), [themeMode])

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <Providers>
      <ThemeProvider value={NAV_THEME[theme === "dark" ? "dark" : "light"]}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </Providers>
  )
}
