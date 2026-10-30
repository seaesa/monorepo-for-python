import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: [
    "@workspace/core",
    "@workspace/api-client",
    "@workspace/i18n",
    "@workspace/theme",
  ],
  typedRoutes: true,
}

export default nextConfig
