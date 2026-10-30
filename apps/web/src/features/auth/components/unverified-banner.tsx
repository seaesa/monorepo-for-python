"use client"

import { useCurrentUser, useResendVerification } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

/** Soft gate: an unverified account can sign in, but business endpoints stay locked. */
export function UnverifiedBanner() {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const resend = useResendVerification()

  if (!user || user.emailVerified) return null

  return (
    <Alert className="mb-6">
      <AlertTitle>{t("auth.banner.title")}</AlertTitle>
      <AlertDescription>
        <p className="mb-3">{t("auth.banner.description", { email: user.email })}</p>
        <Button
          size="sm"
          variant="outline"
          disabled={resend.isPending}
          onClick={() => resend.mutate({ body: { email: user.email } })}
        >
          {resend.isSuccess ? t("auth.banner.resent") : t("auth.banner.resend")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
