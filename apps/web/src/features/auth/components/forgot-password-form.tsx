"use client"

import Link from "next/link"

import { useForgotPasswordForm } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const { form, onSubmit, sentTo } = useForgotPasswordForm()

  if (sentTo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.forgot.sentTitle")}</CardTitle>
          <CardDescription>{t("auth.forgot.sentDescription", { email: sentTo })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            {t("auth.forgot.backToLogin")}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.forgot.title")}</CardTitle>
        <CardDescription>{t("auth.forgot.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormRootError errors={form.formState.errors} />
            <FormInput
              control={form.control}
              name="email"
              label={t("auth.fields.email")}
              type="email"
              autoComplete="email"
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Spinner />}
              {form.formState.isSubmitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
            </Button>
            <Link
              href="/login"
              className="text-center text-sm text-muted-foreground underline underline-offset-4"
            >
              {t("auth.forgot.backToLogin")}
            </Link>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
