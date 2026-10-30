# Build context is the repo root: the web app needs the workspace packages it imports.
# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
# Keep this version in sync with `packageManager` in the root package.json.
RUN npm install --global pnpm@11.25.0
WORKDIR /repo

FROM base AS deps
# Only manifests, so a source edit does not bust the dependency layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/api-client/package.json packages/api-client/
COPY packages/core/package.json packages/core/
COPY packages/i18n/package.json packages/i18n/
COPY packages/theme/package.json packages/theme/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile --filter web...

FROM deps AS build
COPY . .
# NEXT_PUBLIC_* values are baked in at build time, not read at runtime.
# Required: the build fails (lib/env.ts) when one is missing.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
RUN pnpm --filter web build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs
# `output: "standalone"` already contains the server and the traced node_modules.
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
