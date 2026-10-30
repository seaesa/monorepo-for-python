import { i18n } from "@workspace/i18n"

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(i18n.language, options).format(value)
}

export function formatCurrency(value: number, currency = i18n.language === "vi" ? "VND" : "USD") {
  return formatNumber(value, { style: "currency", currency })
}
