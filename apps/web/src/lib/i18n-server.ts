import { cookies, headers } from "next/headers"

import { i18n, resolveLocale } from "@workspace/i18n"

import { LOCALE_COOKIE } from "./i18n-constants"

/** Locale for server rendering: user choice (cookie) → browser (Accept-Language). */
export async function getServerLocale() {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value
  return resolveLocale(fromCookie ?? (await headers()).get("accept-language"))
}

/** Server-side `t` (metadata, server components). Never mutates the shared instance. */
export async function getServerT() {
  return i18n.getFixedT(await getServerLocale())
}
