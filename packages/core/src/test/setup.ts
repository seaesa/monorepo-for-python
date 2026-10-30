import { i18n } from "@workspace/i18n"

// Messages are asserted as English text, so pin the language instead of relying on the
// device default (vi).
await i18n.changeLanguage("en")
