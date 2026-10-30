"use client"

import { useTranslation } from "@workspace/i18n"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

/** Card wrapper so auth pages (server components) stay free of client-only i18n hooks. */
export function AuthCard({ variant }: { variant: "login" | "register" }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`auth.${variant}.title`)}</CardTitle>
        <CardDescription>{t(`auth.${variant}.description`)}</CardDescription>
      </CardHeader>
      <CardContent>{variant === "login" ? <LoginForm /> : <RegisterForm />}</CardContent>
    </Card>
  )
}
