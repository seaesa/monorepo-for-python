import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { View } from "react-native"

import { translateMessage, useTranslation } from "@workspace/i18n"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Text } from "@/components/ui/text"

type FormInputProps<T extends FieldValues> = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChangeText" | "onBlur"
> & {
  control: Control<T>
  name: FieldPath<T>
  label?: string
}

/** RNR `Input` bound to react-hook-form, with label and translated error text. */
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
        <View className="gap-2">
          {label && <Label nativeID={name}>{label}</Label>}
          <Input
            aria-labelledby={name}
            aria-invalid={fieldState.invalid}
            className={fieldState.invalid ? "border-destructive" : undefined}
            value={field.value ?? ""}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            {...props}
          />
          {fieldState.error && (
            <Text className="text-sm text-destructive">
              {translateMessage(fieldState.error.message)}
            </Text>
          )}
        </View>
      )}
    />
  )
}
