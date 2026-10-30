import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import type { FieldErrors } from "react-hook-form"

import { translateMessage, useTranslation } from "@workspace/i18n"

import { Alert, AlertTitle } from "@/components/ui/alert"

/** Renders the server error set by `applyServerErrors` (`root.server`), translated. */
export function FormRootError({ errors }: { errors: FieldErrors }) {
  useTranslation()
  const message = errors.root?.server?.message
  if (!message) return null
  return (
    <Alert variant="destructive" icon={AlertCircleIcon}>
      <AlertTitle>{translateMessage(message)}</AlertTitle>
    </Alert>
  )
}
