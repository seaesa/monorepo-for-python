"use client"

import type { FieldErrors } from "react-hook-form"

import { translateMessage, useTranslation } from "@workspace/i18n"

import { Alert, AlertDescription } from "@/components/ui/alert"

/** Renders the server error set by `applyServerErrors` (`root.server`), translated. */
export function FormRootError({ errors }: { errors: FieldErrors }) {
  useTranslation()
  const message = errors.root?.server?.message
  if (!message) return null
  return (
    <Alert variant="destructive">
      <AlertDescription>{translateMessage(message)}</AlertDescription>
    </Alert>
  )
}
