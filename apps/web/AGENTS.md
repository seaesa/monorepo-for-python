<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# apps/web — Next.js 16 + shadcn (base-maia) + Tailwind v4

Read the root `AGENTS.md` first. This app is **UI only**: data fetching, auth and form schemas
come from `@workspace/core`; API types from `@workspace/api-client`.

## Layout

```
src/
  app/                    routes only (thin): layouts, pages, metadata
    (auth)/login|register|forgot-password|reset-password   guest-only (AuthGate require="guest")
    (app)/todos           signed-in pages (AuthGate require="auth")
    verify-email/         outside both groups: a verification link works signed in or out
    error.tsx global-error.tsx not-found.tsx   rendered by the App Router
  features/<feature>/components/   feature UI (client components): auth, todos, preferences
  components/ui/          shadcn components (CLI-managed)
  components/form/        FormInput, FormRootError (RHF bindings, translated errors)
  components/             providers.tsx, theme-provider.tsx
  lib/                    env.ts, utils.ts (cn), i18n-server.ts (getServerT for metadata)
  styles/globals.css      Tailwind entry; imports @workspace/theme/web.css — no tokens here
  hooks/                  web-only hooks, created when the first one is needed (shared ones belong in packages/core)
```

## Rules

- Pages in `src/app` stay thin: compose feature components, export `metadata`. Interactive code lives in `features/*/components` with `"use client"`.
- Auth is token-based in client storage, so route protection is client-side via `AuthGate` (route-group layouts). Do not read tokens in Server Components.
- Data: use hooks from `@workspace/core/<feature>` (`useTodos`, `useCreateTodo`, …). If a hook is missing, add it to `packages/core`, not here. Never call `axios`/`fetch` directly for the backend.
- Forms: take `{ form, onSubmit }` from the core form hook (`useLoginForm()`, `useTodoComposerForm({ onCreated })`) and render `FormInput` + `FormRootError`. Submit, success state and server errors are already handled there; web-only reactions (a toast, a redirect) go in the hook's callback.
- UI primitives live in `@/components/ui/*`. Add new ones with the shadcn CLI (`pnpm dlx shadcn@latest add <name> -c apps/web`); never hand-write or copy them. Answer **No** when it asks to overwrite existing files (they may contain fixes). Then run `pnpm theme` (root) to make sure the CLI did not write tokens into `globals.css`. Style `base-maia` uses **Base UI**: compose with the `render` prop (e.g. `<DropdownMenuTrigger render={<Button />}>`), not `asChild`.
- Icons: `@hugeicons/react` + `@hugeicons/core-free-icons`. Toasts: `toast` from `sonner`.
- Styling: Tailwind v4 utilities + shared tokens (`bg-background`, `text-muted-foreground`, …) from `packages/theme`. No hard-coded colors, no CSS modules. Merge classes with `cn`.
- Text: `useTranslation()` from `@workspace/i18n` in client components; page `metadata` via `generateMetadata` + `getServerT()` (locale from the `locale` cookie, then Accept-Language).
- Theme mode and language are user preferences in `@workspace/core/preferences`; `PreferencesSync` forwards them to next-themes, `<html lang>` and the cookie. Do not call next-themes `setTheme` directly.
- Workspace packages are compiled via `transpilePackages` in `next.config.ts`; add new internal packages there.
- `typedRoutes` is on: links must point to existing routes.
- Lists use the core list hook (`useTodoList()` → `todos`, `status`, `setStatus`, query state) and a "Load more" button while `hasNextPage`. Toggle and delete are optimistic (the shared hooks roll back on error); a destructive action asks for confirmation in an `AlertDialog`.
- Loading, empty and error states are part of the screen: `TodoListSkeleton` while pending, an `Empty` block, and a retry action on error. Route-level failures are caught by `app/error.tsx`; `global-error.tsx` replaces the root layout, so it uses inline styles only.
- Env: read only through `src/lib/env.ts` (t3-env, validated at build and start; `process.env` elsewhere is a lint error). `NEXT_PUBLIC_*` values are inlined at build time. App constants (cookie names, ages) live in `src/config.ts`.
- Errors go to Sentry when `NEXT_PUBLIC_SENTRY_DSN` is set (`instrumentation*.ts`, `lib/monitoring.ts`; `error.tsx` / `global-error.tsx` report what they catch).
- React Query Devtools render only when `env.NODE_ENV === "development"`.
- React Compiler is on (`reactCompiler: true`): no reflexive `useMemo`/`useCallback`/`memo`.
- No component or e2e tests: behaviour worth testing lives in `packages/core` and the API.

## Commands

```bash
pnpm --filter web dev | build | typecheck
pnpm lint                     # from the root (oxlint covers every workspace)
```
