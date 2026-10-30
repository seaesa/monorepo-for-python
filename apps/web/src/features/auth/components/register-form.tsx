"use client"

import Link from "next/link"

import { applyServerErrors, useZodForm } from "@workspace/core"
import { registerSchema, useRegister } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

export function RegisterForm() {
  const { t } = useTranslation()
  const register = useRegister()
  const form = useZodForm(registerSchema, {
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  })

  const onSubmit = form.handleSubmit((values) =>
    register.submit(values).catch((error) => applyServerErrors(error, form.setError))
  )

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormRootError errors={form.formState.errors} />
        <FormInput
          control={form.control}
          name="fullName"
          label={t("auth.fields.fullName")}
          autoComplete="name"
        />
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
          {form.formState.isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.register.haveAccount")}{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            {t("auth.register.signIn")}
          </Link>
        </p>
      </FieldGroup>
    </form>
  )
}
