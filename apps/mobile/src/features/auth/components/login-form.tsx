import { Link } from "expo-router"
import { View } from "react-native"

import { applyServerErrors, useZodForm } from "@workspace/core"
import { loginSchema, useLogin } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function LoginForm() {
  const { t } = useTranslation()
  const login = useLogin()
  const form = useZodForm(loginSchema, { defaultValues: { email: "", password: "" } })

  const onSubmit = form.handleSubmit((body) =>
    login.mutateAsync({ body }).catch((error) => applyServerErrors(error, form.setError))
  )

  return (
    <View className="gap-4">
      <FormRootError errors={form.formState.errors} />
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
        autoComplete="current-password"
        onSubmitEditing={() => onSubmit()}
      />
      <Button onPress={() => onSubmit()} disabled={form.formState.isSubmitting}>
        <Text>
          {form.formState.isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Text>
      </Button>
      <Text className="text-center text-sm text-muted-foreground">
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className="text-foreground underline">
          {t("auth.login.createOne")}
        </Link>
      </Text>
    </View>
  )
}
