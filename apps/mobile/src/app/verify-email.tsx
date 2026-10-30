import { useLocalSearchParams } from "expo-router"

import { useTranslation } from "@workspace/i18n"

import { LifecycleScreen } from "@/features/auth/components/lifecycle-screen"
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form"

export default function VerifyEmailScreen() {
  const { t } = useTranslation()
  const { token } = useLocalSearchParams<{ token?: string }>()

  return (
    <LifecycleScreen title={t("auth.verify.title")} description={t("auth.verify.description")}>
      <VerifyEmailForm token={token ?? ""} />
    </LifecycleScreen>
  )
}
