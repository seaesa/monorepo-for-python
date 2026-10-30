import { format, formatDistanceToNow, parseISO, type Locale as DateLocale } from "date-fns"
import { enUS, vi } from "date-fns/locale"

import { i18n } from "@workspace/i18n"

type DateInput = string | Date | null | undefined

const DATE_LOCALES: Record<string, DateLocale> = { vi, en: enUS }
const dateLocale = () => DATE_LOCALES[i18n.language] ?? enUS

const toDate = (value: Exclude<DateInput, null | undefined>) =>
  typeof value === "string" ? parseISO(value) : value

/** Localized short date by default ("P": 31/10/2026 in vi, 10/31/2026 in en). */
export function formatDate(value: DateInput, pattern = "P") {
  return value ? format(toDate(value), pattern, { locale: dateLocale() }) : ""
}

export function formatRelative(value: DateInput) {
  return value ? formatDistanceToNow(toDate(value), { addSuffix: true, locale: dateLocale() }) : ""
}
