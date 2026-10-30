import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { getServerT } from "@/lib/i18n-server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return { title: t("notFound.title") }
}

export default async function NotFound() {
  const t = await getServerT()

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl items-center justify-center px-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t("notFound.title")}</EmptyTitle>
          <EmptyDescription>{t("notFound.description")}</EmptyDescription>
        </EmptyHeader>
        <Link href="/todos" className={buttonVariants({ variant: "outline" })}>
          {t("notFound.home")}
        </Link>
      </Empty>
    </main>
  )
}
