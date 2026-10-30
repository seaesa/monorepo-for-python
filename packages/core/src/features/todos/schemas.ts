import type { z } from "zod"

import { zTodoCreate } from "@workspace/api-client/zod"

export const todoFormSchema = zTodoCreate.pick({ title: true, description: true })

export type TodoFormValues = z.infer<typeof todoFormSchema>
