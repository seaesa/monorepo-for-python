"use client"

import { Settings01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useTranslation } from "@workspace/i18n"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PreferencesMenuItems } from "@/features/preferences/components/preferences-menu"

/** Standalone language/theme switcher for signed-out pages. */
export function SettingsButton() {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={t("common.settings")} />}
      >
        <HugeiconsIcon icon={Settings01Icon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <PreferencesMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
