import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"

import { useTranslation } from "@workspace/i18n"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PreferencesSection } from "@/features/preferences/components/preferences-section"

import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

/** Shared shell for login/register: card + language picker. */
export function AuthScreen({ variant }: { variant: "login" | "register" }) {
  const { t } = useTranslation()
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center gap-6 p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-sm gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t(`auth.${variant}.title`)}</CardTitle>
              <CardDescription>{t(`auth.${variant}.description`)}</CardDescription>
            </CardHeader>
            <CardContent>{variant === "login" ? <LoginForm /> : <RegisterForm />}</CardContent>
          </Card>
          <PreferencesSection showTheme={false} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
