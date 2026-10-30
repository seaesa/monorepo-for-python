import { ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { formatDate } from "@workspace/core"
import { useCurrentUser, useLogout } from "@workspace/core/auth"
import { useTranslation } from "@workspace/i18n"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Text } from "@/components/ui/text"
import { PreferencesSection } from "@/features/preferences/components/preferences-section"

export default function ProfileScreen() {
  const { t } = useTranslation()
  const { data: user, isPending } = useCurrentUser()
  const logout = useLogout()

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-6 p-6">
        <View className="items-center gap-4">
          <Avatar alt={user?.fullName ?? ""} className="size-20">
            <AvatarFallback>
              <Text className="text-2xl">{user?.fullName?.[0]?.toUpperCase()}</Text>
            </AvatarFallback>
          </Avatar>
          {isPending ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <View className="items-center gap-1">
              <Text variant="h4">{user?.fullName}</Text>
              <Text className="text-muted-foreground">{user?.email}</Text>
              <Text className="text-xs text-muted-foreground">
                {t("profile.memberSince", { date: formatDate(user?.createdAt) })}
              </Text>
            </View>
          )}
        </View>
        <Card>
          <CardContent>
            <PreferencesSection />
          </CardContent>
        </Card>
        <Button variant="outline" onPress={() => logout.mutate()}>
          <Text>{t("common.signOut")}</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}
