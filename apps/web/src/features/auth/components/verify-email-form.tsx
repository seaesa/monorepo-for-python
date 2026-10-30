"use client"

import Link from "next/link"

import { useVerifyEmailForm } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

export function VerifyEmailForm({ token }: { token: string }) {
  const { t } = useTranslation()
  const { form, onSubmit, isDone, isVerifyingLink } = useVerifyEmailForm(token)

  if (isDone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.verify.successTitle")}</CardTitle>
          <CardDescription>{t("auth.verify.successDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/todos" className={buttonVariants()}>
            {t("auth.verify.continue")}
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (isVerifyingLink) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Spinner />
          {t("auth.verify.submitting")}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.verify.title")}</CardTitle>
        <CardDescription>{t("auth.verify.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormRootError errors={form.formState.errors} />
            <FormInput
              control={form.control}
              name="token"
              label={t("auth.verify.code")}
              autoComplete="one-time-code"
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Spinner />}
              {form.formState.isSubmitting ? t("auth.verify.submitting") : t("auth.verify.submit")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
