import { View } from "react-native"

import { useTodoComposerForm } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function TodoComposer() {
  const { t } = useTranslation()
  const { form, onSubmit } = useTodoComposerForm()

  return (
    <View className="flex-row items-start gap-2">
      <View className="flex-1">
        <FormInput
          control={form.control}
          name="title"
          placeholder={t("todos.placeholder")}
          returnKeyType="done"
          onSubmitEditing={() => onSubmit()}
        />
      </View>
      <Button onPress={() => onSubmit()} disabled={form.formState.isSubmitting}>
        <Text>{t("todos.add")}</Text>
      </Button>
    </View>
  )
}
