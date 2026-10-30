import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

/** Show pushes while the app is in the foreground (the OS hides them by default). */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
  })
}

/**
 * Ask for permission and return this install's Expo push token, or null when pushes are
 * impossible (simulator, web, denied, no EAS project id configured).
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) return null
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
  if (!projectId) return null

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const current = await Notifications.getPermissionsAsync()
  const { granted } = current.granted ? current : await Notifications.requestPermissionsAsync()
  if (!granted) return null

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
  return data
}
