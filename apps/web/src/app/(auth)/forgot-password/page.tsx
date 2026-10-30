import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"
import { getServerT } from "@/lib/i18n-server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return { title: t("auth.forgot.title") }
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
