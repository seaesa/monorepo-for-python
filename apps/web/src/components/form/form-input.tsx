"use client"

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"

import { translateMessage, useTranslation } from "@workspace/i18n"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type FormInputProps<T extends FieldValues> = Omit<
  React.ComponentProps<typeof Input>,
  "name" | "defaultValue"
> & {
  control: Control<T>
  name: FieldPath<T>
  label?: string
}

/** shadcn `Field` + `Input` bound to react-hook-form, with translated error display. */
export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  ...props
}: FormInputProps<T>) {
  useTranslation() // re-render error messages when the language changes
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <Input
            {...props}
            {...field}
            value={field.value ?? ""}
            id={name}
            aria-invalid={fieldState.invalid}
          />
          <FieldError>{translateMessage(fieldState.error?.message)}</FieldError>
        </Field>
      )}
    />
  )
}
