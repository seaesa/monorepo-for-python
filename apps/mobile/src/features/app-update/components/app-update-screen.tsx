import * as Application from "expo-application"
import { Linking, Platform, View } from "react-native"

import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { env } from "@/lib/env"

function storeUrl() {
  if (Platform.OS === "android") return `market://details?id=${Application.applicationId}`
  if (Platform.OS === "ios" && env.EXPO_PUBLIC_IOS_STORE_ID) {
    return `itms-apps://apps.apple.com/app/id${env.EXPO_PUBLIC_IOS_STORE_ID}`
  }
  return null
}

/** Replaces the whole app once the API rejects this build (`app_update_required`). */
export function AppUpdateScreen() {
  const { t } = useTranslation()
  const url = storeUrl()
  return (
    <View className="bg-background flex-1 justify-center p-6">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("appUpdate.title")}</CardTitle>
          <CardDescription>{t("appUpdate.description")}</CardDescription>
        </CardHeader>
        {url && (
          <CardContent>
            <Button onPress={() => void Linking.openURL(url)}>
              <Text>{t("appUpdate.action")}</Text>
            </Button>
          </CardContent>
        )}
      </Card>
    </View>
  )
}
