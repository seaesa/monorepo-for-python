"use client"

import { toast } from "sonner"

import { useTodoComposerForm } from "@workspace/core/todos"
import { useTranslation } from "@workspace/i18n"

import { FormInput } from "@/components/form/form-input"
import { Button } from "@/components/ui/button"

export function TodoComposer() {
  const { t } = useTranslation()
  const { form, onSubmit } = useTodoComposerForm({
    onCreated: () => toast.success(t("todos.added")),
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
