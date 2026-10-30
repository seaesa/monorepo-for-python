import * as Notifications from "expo-notifications"
import { router, type Href } from "expo-router"
import { useEffect } from "react"
import { Platform } from "react-native"

import { useAuthStore } from "@workspace/core/auth"
import { useRegisterPushDevice } from "@workspace/core/notifications"
import { useLocale } from "@workspace/core/preferences"

import { getExpoPushToken } from "@/lib/notifications"

/** Mount once inside the signed-in tree: registers this device and routes notification taps. */
export function usePushRegistration() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken)
  const locale = useLocale()
  const { mutateAsync: register } = useRegisterPushDevice()

  // Re-run on locale change: the server renders pushes in the language of the last registration.
  useEffect(() => {
    if (!isAuthenticated) return
    void (async () => {
      const token = await getExpoPushToken()
      if (token)
        await register({ token, locale, platform: Platform.OS === "ios" ? "ios" : "android" })
    })().catch(() => null)
  }, [isAuthenticated, locale, register])

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url
      if (typeof url === "string") router.push(url as Href)
    })
    return () => subscription.remove()
  }, [])
}
