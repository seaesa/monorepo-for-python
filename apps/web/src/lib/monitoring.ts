import type { BrowserOptions, NodeOptions } from "@sentry/nextjs"

import { env } from "./env"

/** Shared Sentry options for browser, Node and edge. Reporting is off without a DSN. */
export const sentryOptions = {
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(env.NEXT_PUBLIC_SENTRY_DSN),
  environment: env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: env.NEXT_PUBLIC_APP_ENV === "production" ? 0.1 : 1,
} satisfies BrowserOptions & NodeOptions
