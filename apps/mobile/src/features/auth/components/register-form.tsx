import { Link } from "expo-router"
import { View } from "react-native"

import { applyServerErrors, useZodForm } from "@workspace/core"
import { registerSchema, useRegister } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function RegisterForm() {
  const { t } = useTranslation()
  const register = useRegister()
  const form = useZodForm(registerSchema, {
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  })

  const onSubmit = form.handleSubmit((values) =>
    register.submit(values).catch((error) => applyServerErrors(error, form.setError))
  )

  return (
    <View className="gap-4">
      <FormRootError errors={form.formState.errors} />
      <FormInput
        control={form.control}
        name="fullName"
        label={t("auth.fields.fullName")}
        autoComplete="name"
      />
      <FormInput
        control={form.control}
        name="email"
        label={t("auth.fields.email")}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <FormInput
        control={form.control}
        name="password"
        label={t("auth.fields.password")}
        secureTextEntry
      />
      <FormInput
        control={form.control}
        name="confirmPassword"
        label={t("auth.fields.confirmPassword")}
        secureTextEntry
        onSubmitEditing={() => onSubmit()}
      />
      <Button onPress={() => onSubmit()} disabled={form.formState.isSubmitting}>
        <Text>
          {form.formState.isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
        </Text>
      </Button>
      <Text className="text-center text-sm text-muted-foreground">
        {t("auth.register.haveAccount")}{" "}
        <Link href="/login" className="text-foreground underline">
          {t("auth.register.signIn")}
        </Link>
      </Text>
    </View>
  )
}
