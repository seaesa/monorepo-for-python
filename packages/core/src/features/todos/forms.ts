import { useApiForm } from "../../lib/form"
import { useCreateTodo } from "./hooks"
import { todoFormSchema } from "./schemas"

/** Create form; resets after a successful create so the next todo can be typed straight away. */
export function useTodoComposerForm({ onCreated }: { onCreated?: () => void } = {}) {
  const createTodo = useCreateTodo()
  const apiForm = useApiForm(todoFormSchema, {
    defaultValues: { title: "" },
    submit: (body) => createTodo.mutateAsync({ body }),
    onSuccess: () => {
      apiForm.form.reset()
      onCreated?.()
    },
  })
  return apiForm
}
