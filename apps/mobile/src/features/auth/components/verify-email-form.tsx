import { useRouter } from "expo-router"
import { View } from "react-native"

import { useCurrentUser, useResendVerification, useVerifyEmailForm } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { FormRootError } from "@/components/form/form-root-error"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

/** Verifies a code from the email; auto-submits when the link carries a token. */
export function VerifyEmailForm({ token: initialToken = "" }: { token?: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const resend = useResendVerification()
  const email = useCurrentUser().data?.email
  const { form, onSubmit, isDone } = useVerifyEmailForm(initialToken)

  if (isDone) {
    return (
      <View className="gap-4">
        <Text className="font-medium">{t("auth.verify.successTitle")}</Text>
        <Text className="text-muted-foreground text-sm">{t("auth.verify.successDescription")}</Text>
        <Button onPress={() => router.replace("/")}>
          <Text>{t("auth.verify.continue")}</Text>
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
        onSubmitEditing={() => onSubmit()}
      />
      <Button onPress={() => onSubmit()} disabled={form.formState.isSubmitting}>
        <Text>
          {form.formState.isSubmitting ? t("auth.verify.submitting") : t("auth.verify.submit")}
        </Text>
      </Button>
      {email ? (
        <View className="gap-2">
          <Text className="text-muted-foreground text-center text-sm">
            {t("auth.verify.resendHint")}
          </Text>
          <Button
            variant="outline"
            disabled={resend.isPending}
            onPress={() => resend.mutate({ body: { email } })}
          >
            <Text>{resend.isSuccess ? t("auth.verify.resent") : t("auth.verify.resend")}</Text>
          </Button>
        </View>
      ) : null}
    </View>
  )
}
