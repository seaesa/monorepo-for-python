"use client"

import { useTranslation } from "@workspace/i18n"

import { TodoComposer } from "./todo-composer"
import { TodoList } from "./todo-list"

export function TodosView() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("todos.title")}</h1>
      <TodoComposer />
      <TodoList />
    </div>
  )
}
