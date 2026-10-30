"use client"

import Link from "next/link"

import { applyServerErrors, useZodForm } from "@workspace/core"
import { loginSchema, useLogin } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

export function LoginForm() {
  const { t } = useTranslation()
  const login = useLogin()
  const form = useZodForm(loginSchema, { defaultValues: { email: "", password: "" } })

  const onSubmit = form.handleSubmit((body) =>
    login.mutateAsync({ body }).catch((error) => applyServerErrors(error, form.setError))
  )

  return (
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
        <FormInput
          control={form.control}
          name="password"
          label={t("auth.fields.password")}
          type="password"
          autoComplete="current-password"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />}
          {form.formState.isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.login.noAccount")}{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            {t("auth.login.createOne")}
          </Link>
        </p>
      </FieldGroup>
    </form>
  )
}
