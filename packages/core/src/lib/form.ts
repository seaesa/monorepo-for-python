import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type FieldValues, type UseFormProps } from "react-hook-form"
import type { z } from "zod"

import { getApiError, getFieldErrors } from "@workspace/api-client"
import { translateKey } from "@workspace/i18n"

/** `useForm` pre-wired with a Zod schema (usually one generated from the backend). */
export function useZodForm<TInput extends FieldValues, TOutput extends FieldValues>(
  schema: z.ZodType<TOutput, TInput>,
  props?: Omit<UseFormProps<TInput, unknown, TOutput>, "resolver">
) {
  return useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    ...props,
  })
}

/**
 * Translate a backend code: `errors.<code>` (ErrorCode) or `validation.<code>` (Pydantic
 * error type), interpolated with `params`; falls back to the server's English message.
 */
export function translateApiCode(code: string, fallback: string, params?: object | null) {
  const options = params ?? undefined
  return (
    translateKey(`errors.${code}`, options) ??
    translateKey(`validation.${code}`, options) ??
    fallback
  )
}

/**
 * Push a backend error into a react-hook-form form:
 * - `details[]` (422 validation or domain errors raised with `field=`) → that field,
 * - otherwise → `root.server`.
 * Messages are translated from codes, so wording lives in packages/i18n, not the API.
 * Field paths are camelCase dot paths, identical to RHF names.
 */
export function applyServerErrors(
  error: unknown,
  setError: (name: never, error: { type: string; message: string }) => void
) {
  const fieldErrors = getFieldErrors(error)
  for (const { field, code, message, params } of fieldErrors) {
    setError(field as never, { type: "server", message: translateApiCode(code, message, params) })
  }
  if (fieldErrors.length) return
  const { code, message } = getApiError(error)
  setError("root.server" as never, { type: "server", message: translateApiCode(code, message) })
}

type ApiFormOptions<TInput extends FieldValues, TOutput extends FieldValues, TResult> = Omit<
  UseFormProps<TInput, unknown, TOutput>,
  "resolver"
> & {
  submit: (values: TOutput) => Promise<TResult>
  onSuccess?: (result: TResult, values: TOutput) => void
}

/**
 * A form that submits to the API: client validation from `schema`, then `submit`; a rejected
 * submit is routed to fields / `root.server` by `applyServerErrors`. Screens only render.
 */
export function useApiForm<TInput extends FieldValues, TOutput extends FieldValues, TResult>(
  schema: z.ZodType<TOutput, TInput>,
  { submit, onSuccess, ...props }: ApiFormOptions<TInput, TOutput, TResult>
) {
  const form = useZodForm(schema, props)
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      onSuccess?.(await submit(values), values)
    } catch (error) {
      applyServerErrors(error, form.setError)
    }
  })
  return { form, onSubmit }
}
