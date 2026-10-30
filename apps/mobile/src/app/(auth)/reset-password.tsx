import { useLocalSearchParams } from "expo-router"

import { useTranslation } from "@workspace/i18n"

import { LifecycleScreen } from "@/features/auth/components/lifecycle-screen"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

export default function ResetPasswordScreen() {
  const { t } = useTranslation()
  const { token } = useLocalSearchParams<{ token?: string }>()

  return (
    <LifecycleScreen title={t("auth.reset.title")} description={t("auth.reset.description")}>
      <ResetPasswordForm token={token ?? ""} />
    </LifecycleScreen>
  )
}
