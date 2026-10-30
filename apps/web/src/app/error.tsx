"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

/** Route-level boundary: a thrown error inside a page keeps the layout and offers a retry. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl items-center justify-center px-4">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>{t("error.title")}</EmptyTitle>
          <EmptyDescription>{t("error.description")}</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={() => reset()}>
          {t("common.retry")}
        </Button>
      </Empty>
    </main>
  )
}
