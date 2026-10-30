"use client"

import { toast } from "sonner"

import { applyServerErrors, useZodForm } from "@workspace/core"
import { todoFormSchema, useCreateTodo } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { Button } from "@/components/ui/button"

export function TodoComposer() {
  const { t } = useTranslation()
  const createTodo = useCreateTodo()
  const form = useZodForm(todoFormSchema, { defaultValues: { title: "" } })

  const onSubmit = form.handleSubmit(async (body) => {
    try {
      await createTodo.mutateAsync({ body })
      form.reset()
      toast.success(t("todos.added"))
    } catch (error) {
      applyServerErrors(error, form.setError)
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex items-start gap-2" noValidate>
      <div className="flex-1">
        <FormInput control={form.control} name="title" placeholder={t("todos.placeholder")} />
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {t("todos.add")}
      </Button>
    </form>
  )
}
