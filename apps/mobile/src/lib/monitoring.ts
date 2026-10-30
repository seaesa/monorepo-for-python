import * as Sentry from "@sentry/react-native"

import { env } from "./env"

/** Reporting is off without a DSN. Call before anything else can throw. */
export function initMonitoring() {
  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: Boolean(env.EXPO_PUBLIC_SENTRY_DSN),
    environment: env.EXPO_PUBLIC_APP_ENV,
    tracesSampleRate: env.EXPO_PUBLIC_APP_ENV === "production" ? 0.1 : 1,
    sendDefaultPii: false,
  })
}
