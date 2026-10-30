import { useTranslation } from "@workspace/i18n"

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"
import { LifecycleScreen } from "@/features/auth/components/lifecycle-screen"

export default function ForgotPasswordScreen() {
  const { t } = useTranslation()

  return (
    <LifecycleScreen title={t("auth.forgot.title")} description={t("auth.forgot.description")}>
      <ForgotPasswordForm />
    </LifecycleScreen>
  )
}
