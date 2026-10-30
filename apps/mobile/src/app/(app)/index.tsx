import { SafeAreaView } from "react-native-safe-area-context"

import { useTranslation } from "@workspace/i18n"

import { Text } from "@/components/ui/text"
import { TodoList } from "@/features/todos/components/todo-list"

export default function TodosScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <Text variant="h3" className="px-4 pt-4">
        {t("todos.title")}
      </Text>
      <TodoList />
    </SafeAreaView>
  )
}
