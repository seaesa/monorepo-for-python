"use client"

import Link from "next/link"

import { useResetPasswordForm } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useTranslation()
  const { form, onSubmit, isDone } = useResetPasswordForm(token)

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.reset.title")}</CardTitle>
          <CardDescription>{t("auth.reset.invalidToken")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className={buttonVariants({ variant: "outline" })}>
            {t("auth.reset.requestNew")}
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (isDone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.reset.successTitle")}</CardTitle>
          <CardDescription>{t("auth.reset.successDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={buttonVariants()}>
            {t("auth.forgot.backToLogin")}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.reset.title")}</CardTitle>
        <CardDescription>{t("auth.reset.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormRootError errors={form.formState.errors} />
            <FormInput
              control={form.control}
              name="password"
              label={t("auth.fields.password")}
              type="password"
              autoComplete="new-password"
            />
            <FormInput
              control={form.control}
              name="confirmPassword"
              label={t("auth.fields.confirmPassword")}
              type="password"
              autoComplete="new-password"
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Spinner />}
              {form.formState.isSubmitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
