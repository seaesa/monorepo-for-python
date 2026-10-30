# packages/core — shared logic for web and mobile

Everything both apps need that is not UI: API hooks, auth/session state, form schemas, helpers.
If you are about to write the same hook in `apps/web` and `apps/mobile`, it belongs here.

## Layout

```
src/
  index.ts                 setupCore({ apiUrl, storage, detectLocale }), createQueryClient, helpers
  features/<feature>/
    hooks.ts               React Query hooks built on generated options from @workspace/api-client/query
    schemas.ts             form schemas = generated Zod schemas (+ UI-only fields/refinements)
    store.ts               Zustand stores (auth tokens; preferences: locale + theme mode)
    realtime.ts            cache-sync handlers for this feature's socket events (optional)
    index.ts               public surface → exported as "@workspace/core/<feature>"
  lib/
    query-client.ts        shared QueryClient defaults (no retry on 4xx)
    form.ts                useZodForm, applyServerErrors, translateApiCode
    date.ts                date-fns helpers, localized to the current language
    number.ts              Intl number/currency helpers, localized
    storage.ts             delegating persist storage shared by all stores
```

## Rules

- **Platform-agnostic only.** No imports from `react-native`, `expo-*`, `next/*`, DOM-only APIs, or UI kits. Platform specifics are injected by the app (e.g. `storage` in `setupCore`).
- Build hooks by spreading generated helpers: `useQuery({ ...listTodosOptions({ query }) })`, `useMutation({ ...createTodoMutation(), onSettled })`. Do not write `queryFn`/`queryKey` by hand.
- After a mutation, invalidate by operation id (`queryKey: [{ _id }]` from the generated `*QueryKey()`), so every page/filter of that list refreshes.
- Form schemas start from `@workspace/api-client/zod`; only add UI-only fields (e.g. `confirmPassword`) or `.pick()` subsets. Never redefine backend rules.
- Shared-state libs are `peerDependencies` (one instance per app). Add new ones the same way and install them in both apps.
- New feature folder → add `"./<feature>": "./src/features/<feature>/index.ts"` to `package.json` `exports`.
- Export only what apps use; keep names consistent: `use<Entity>s`, `useCreate<Entity>`, `useUpdate<Entity>`, `useDelete<Entity>`, `<entity>FormSchema`.

## Realtime

`features/realtime`: one Socket.IO connection (`socket.io-client`, websocket transport, web + RN)
created by `setupCore`, connected by `useRealtimeConnection()` (mounted once in each app's
providers) while signed in. Handshake uses the current access token; on `unauthorized` it calls
`refreshSession()` and reconnects. Event names/payloads are typed from the generated
`RealtimeEvents`. To react to a new event:

- cache sync (most cases): add `features/<feature>/realtime.ts` exporting `RealtimeHandlers`
  (`{ "<event>": (payload, queryClient) => … }`) and list it in `features/realtime/handlers.ts`;
- UI reaction (toast, sound): `useRealtimeEvent("<event>", handler)` in a component.

Prefer invalidating/patching React Query caches over keeping socket data in separate state.

## Auth flow

`setupCore` (idempotent) → `configureApiClient` (bearer + refresh interceptors) → plug platform
storage → apply detected locale → rehydrate preferences (locale/theme) → rehydrate auth.
`useAuthStore.hydrated` flips last: gate UI on it and both language and tokens are ready.
Persisted stores use `persistStorage` (delegates to the platform storage plugged in at setup).

## Form errors

`applyServerErrors(error, form.setError)` puts every `FieldError` from the API on its field and
anything else on `root.server`, translated via `translateApiCode` (`errors.<code>` or
`validation.<code>`, with `params`). Custom Zod messages are i18n keys
(`"validation.passwordsMismatch"`), rendered with `translateMessage`.

```bash
pnpm --filter @workspace/core typecheck | lint
```
