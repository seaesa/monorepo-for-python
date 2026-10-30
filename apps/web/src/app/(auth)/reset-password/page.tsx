import type { Metadata } from "next"

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"
import { getServerT } from "@/lib/i18n-server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return { title: t("auth.reset.title") }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <ResetPasswordForm token={token ?? ""} />
}
