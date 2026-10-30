import type { Metadata } from "next"

import { TodosView } from "@/features/todos/components/todos-view"
import { getServerT } from "@/lib/i18n-server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT()
  return { title: t("todos.title") }
}

export default function TodosPage() {
  return <TodosView />
}
