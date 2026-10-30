import { SafeAreaView } from "react-native-safe-area-context"

import { useTranslation } from "@workspace/i18n"

import { Text } from "@/components/ui/text"
import { UnverifiedBanner } from "@/features/auth/components/unverified-banner"
import { TodoList } from "@/features/todos/components/todo-list"

export default function TodosScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView edges={["top"]} className="bg-background flex-1">
      <Text variant="h3" className="px-4 pt-4">
        {t("todos.title")}
      </Text>
      <UnverifiedBanner />
      <TodoList />
    </SafeAreaView>
  )
}
