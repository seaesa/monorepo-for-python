import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { View } from "react-native"

import { useCurrentUser, useResendVerification } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

/** Shown above the todo list while the account has not confirmed its email. */
export function UnverifiedBanner() {
  const { t } = useTranslation()
  const user = useCurrentUser().data
  const resend = useResendVerification()

  if (!user || user.emailVerified) return null

  return (
    <View className="px-4 pt-4">
      <Alert icon={InformationCircleIcon}>
        <AlertTitle>{t("auth.banner.title")}</AlertTitle>
        <AlertDescription>{t("auth.banner.description", { email: user.email })}</AlertDescription>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 self-start"
          disabled={resend.isPending}
          onPress={() => resend.mutate({ body: { email: user.email } })}
        >
          <Text>{resend.isSuccess ? t("auth.banner.resent") : t("auth.banner.resend")}</Text>
        </Button>
      </Alert>
    </View>
  )
}
