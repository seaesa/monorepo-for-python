import { View } from "react-native"

import { useSendTestPush } from "@workspace/core/notifications"
import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { useCurrentLocation } from "@/hooks/use-current-location"

export function DeviceSection() {
  const { t } = useTranslation()
  const testPush = useSendTestPush()
  const location = useCurrentLocation()

  return (
    <View className="gap-3">
      <Text variant="large">{t("device.title")}</Text>
      <Button variant="outline" disabled={testPush.isPending} onPress={() => testPush.mutate({})}>
        <Text>{t("device.sendTestPush")}</Text>
      </Button>
      {testPush.isSuccess ? (
        <Text className="text-muted-foreground text-sm">{t("device.testPushQueued")}</Text>
      ) : null}
      <Button
        variant="outline"
        disabled={location.status === "loading"}
        onPress={() => void location.request()}
      >
        <Text>{t("device.showLocation")}</Text>
      </Button>
      {location.status === "ready" && location.coords ? (
        <Text className="text-muted-foreground text-sm">
          {t("device.coordinates", {
            latitude: location.coords.latitude.toFixed(4),
            longitude: location.coords.longitude.toFixed(4),
          })}
        </Text>
      ) : null}
      {location.status === "denied" || location.status === "error" ? (
        <Text className="text-destructive text-sm">{t(`device.location.${location.status}`)}</Text>
      ) : null}
    </View>
  )
}
