import { Link } from "expo-router"
import { View } from "react-native"

import { useForgotPasswordForm } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const { form, onSubmit, sentTo } = useForgotPasswordForm()

  if (sentTo) {
    return (
      <View className="gap-4">
        <Text className="font-medium">{t("auth.forgot.sentTitle")}</Text>
        <Text className="text-muted-foreground text-sm">
          {t("auth.forgot.sentDescription", { email: sentTo })}
        </Text>
        <Link href="/login" className="text-foreground text-center text-sm underline">
          {t("auth.forgot.backToLogin")}
        </Link>
      </View>
    )
  }

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
        onSubmitEditing={() => onSubmit()}
      />
      <Button onPress={() => onSubmit()} disabled={form.formState.isSubmitting}>
        <Text>
          {form.formState.isSubmitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
        </Text>
      </Button>
      <Link href="/login" className="text-muted-foreground text-center text-sm underline">
        {t("auth.forgot.backToLogin")}
      </Link>
    </View>
  )
}
