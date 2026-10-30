import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/** Shell for the account-lifecycle screens (verify email, forgot/reset password). */
export function LifecycleScreen({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="bg-background flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center gap-6 p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
