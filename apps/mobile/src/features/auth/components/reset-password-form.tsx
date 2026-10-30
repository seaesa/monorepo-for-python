import { Link, useRouter } from "expo-router"
import { View } from "react-native"

import { useResetPasswordForm } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

/** The reset code is editable because the email also prints it for copy-paste into the app. */
export function ResetPasswordForm({ token = "" }: { token?: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { form, onSubmit, isDone } = useResetPasswordForm(token)

  if (isDone) {
    return (
      <View className="gap-4">
        <Text className="font-medium">{t("auth.reset.successTitle")}</Text>
        <Text className="text-muted-foreground text-sm">{t("auth.reset.successDescription")}</Text>
        <Button onPress={() => router.replace("/login")}>
          <Text>{t("auth.forgot.backToLogin")}</Text>
        </Button>
      </View>
    )
  }

  return (
    <View className="gap-4">
      <FormRootError errors={form.formState.errors} />
      <FormInput
        control={form.control}
        name="token"
        label={t("auth.verify.code")}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FormInput
        control={form.control}
        name="password"
        label={t("auth.fields.password")}
        secureTextEntry
        autoComplete="new-password"
      />
      <FormInput
        control={form.control}
        name="confirmPassword"
        label={t("auth.fields.confirmPassword")}
        secureTextEntry
        autoComplete="new-password"
        onSubmitEditing={() => onSubmit()}
      />
      <Button onPress={() => onSubmit()} disabled={form.formState.isSubmitting}>
        <Text>
          {form.formState.isSubmitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
        </Text>
      </Button>
      <Link href="/forgot-password" className="text-muted-foreground text-center text-sm underline">
        {t("auth.reset.requestNew")}
      </Link>
    </View>
  )
}
