import { View } from "react-native"

import { THEME_MODES, useLocale, usePreferencesStore } from "@workspace/core/preferences"
import { SUPPORTED_LOCALES, useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  label: (option: T) => string
}) {
  return (
    <View className="flex-row gap-1 rounded-4xl bg-muted p-1">
      {options.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={option === value ? "outline" : "ghost"}
          className={option === value ? "flex-1 bg-background" : "flex-1"}
          onPress={() => onChange(option)}
        >
          <Text>{label(option)}</Text>
        </Button>
      ))}
    </View>
  )
}

/** Language (and optionally theme) pickers backed by the shared preferences store. */
export function PreferencesSection({ showTheme = true }: { showTheme?: boolean }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { theme, setLocale, setTheme } = usePreferencesStore()

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-medium text-muted-foreground">{t("settings.language")}</Text>
        <Segmented
          options={SUPPORTED_LOCALES}
          value={locale}
          onChange={setLocale}
          label={(l) => t(`languages.${l}`)}
        />
      </View>
      {showTheme && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">{t("settings.theme")}</Text>
          <Segmented
            options={THEME_MODES}
            value={theme}
            onChange={setTheme}
            label={(m) => t(`settings.themes.${m}`)}
          />
        </View>
      )}
    </View>
  )
}
