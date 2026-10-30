import { NativeTabs } from "expo-router/native-tabs"

import { useTranslation } from "@workspace/i18n"

export default function AppLayout() {
  const { t } = useTranslation()
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t("todos.tab")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/home.png")} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t("profile.title")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require("@/assets/images/tabIcons/explore.png")} />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
