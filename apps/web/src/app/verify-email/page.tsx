import type { Metadata } from "next"

import { AuthShell } from "@/features/auth/components/auth-shell"
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form"
import { getServerT } from "@/lib/i18n-server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return { title: t("auth.verify.title") }
}

/** Outside the `(auth)` group on purpose: a verification link must work while signed in too. */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <AuthShell>
      <VerifyEmailForm token={token ?? ""} />
    </AuthShell>
  )
}
