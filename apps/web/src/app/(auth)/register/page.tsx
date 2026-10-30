import type { Metadata } from "next"

import { AuthCard } from "@/features/auth/components/auth-card"
import { getServerT } from "@/lib/i18n-server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return { title: t("auth.register.title") }
}

export default function RegisterPage() {
  return <AuthCard variant="register" />
}
