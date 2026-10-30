import "@/lib/polyfills"
import "@/global.css"

import { PortalHost } from "@rn-primitives/portal"
import * as Sentry from "@sentry/react-native"
import { useFonts } from "expo-font"
import { Stack, ThemeProvider } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { Uniwind, useUniwind } from "uniwind"

import { useAppUpdateStore } from "@workspace/core/app-update"
import { useAuthStore } from "@workspace/core/auth"
import { usePreferencesStore } from "@workspace/core/preferences"

import { Providers } from "@/components/providers"
import { AppUpdateScreen } from "@/features/app-update/components/app-update-screen"
import { FONTS } from "@/lib/fonts"
import { setupApp } from "@/lib/setup"
import { NAV_THEME } from "@/lib/theme"

void SplashScreen.preventAutoHideAsync()
void setupApp()

function RootLayout() {
  const [fontsLoaded] = useFonts(FONTS)
  const { theme } = useUniwind()
  const themeMode = usePreferencesStore((s) => s.theme)
  const hydrated = useAuthStore((s) => s.hydrated)
  const isAuthenticated = useAuthStore((s) => !!s.accessToken)
  const updateRequired = useAppUpdateStore((s) => s.required)
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
        {updateRequired ? (
          <AppUpdateScreen />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={isAuthenticated}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            {/* Reachable in every session state: a verification link must work signed in or out. */}
            <Stack.Screen name="verify-email" />
          </Stack>
        )}
        <PortalHost />
      </ThemeProvider>
    </Providers>
  )
}

export default Sentry.wrap(RootLayout)
