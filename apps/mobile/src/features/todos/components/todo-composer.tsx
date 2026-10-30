import { View } from "react-native"

import { applyServerErrors, useZodForm } from "@workspace/core"
import { todoFormSchema, useCreateTodo } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export function TodoComposer() {
  const { t } = useTranslation()
  const createTodo = useCreateTodo()
  const form = useZodForm(todoFormSchema, { defaultValues: { title: "" } })

  const onSubmit = form.handleSubmit(async (body) => {
    try {
      await createTodo.mutateAsync({ body })
      form.reset()
    } catch (error) {
      applyServerErrors(error, form.setError)
    }
  })

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
