import path from "node:path"
import { withSentryConfig } from "@sentry/nextjs/config"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for the container image (see apps/web/Dockerfile).
  output: "standalone",
  // Trace dependencies from the repo root, so workspace packages land inside .next/standalone.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: [
    "@workspace/core",
    "@workspace/api-client",
    "@workspace/i18n",
    "@workspace/theme",
  ],
  typedRoutes: true,
  reactCompiler: true,
}

// Source maps upload only when SENTRY_AUTH_TOKEN/ORG/PROJECT are set in the build environment.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
})
