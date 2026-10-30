"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { i18n, useTranslation } from "@workspace/i18n"

/**
 * Last-resort boundary: it replaces the root layout, so it cannot rely on the app's
 * stylesheet, fonts or providers. Everything here is inline on purpose.
 */
export default function GlobalError({
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
    <html lang={i18n.language}>
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem" }}>{t("error.title")}</h1>
          <p style={{ margin: "0 0 1rem", opacity: 0.7 }}>{t("error.description")}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: "pointer",
              borderRadius: "9999px",
              border: "1px solid currentColor",
              background: "transparent",
              padding: "0.5rem 1rem",
              font: "inherit",
            }}
          >
            {t("common.retry")}
          </button>
        </div>
      </body>
    </html>
  )
}
