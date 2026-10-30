# packages/core — shared logic for web and mobile

Everything both apps need that is not UI: API hooks, auth/session state, form schemas, helpers.
If you are about to write the same hook in `apps/web` and `apps/mobile`, it belongs here.

## Layout

```
src/
  index.ts                 setupCore({ apiUrl, storage, detectLocale }), createQueryClient, helpers
  features/<feature>/
    hooks.ts               React Query hooks built on generated options from @workspace/api-client/query
    forms.ts               headless form hooks: use<Action>Form → { form, onSubmit, …state }
    schemas.ts             form schemas = generated Zod schemas (+ UI-only fields/refinements)
    store.ts               Zustand stores (auth tokens; preferences: locale + theme mode)
    realtime.ts            cache-sync handlers for this feature's socket events (optional)
    keys.ts                query-key helpers for invalidation (optional)
    index.ts               public surface → exported as "@workspace/core/<feature>"
  realtime/                socket client, handler registry, useRealtimeConnection/useRealtimeEvent
  lib/
    query-client.ts        shared QueryClient defaults (no retry on 4xx)
    form.ts                useZodForm, useApiForm, applyServerErrors, translateApiCode
    locale.ts              acceptLanguage() header for locale-aware endpoints
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
- **Forms are headless here, rendered in apps.** A form hook owns the schema, default values,
  submit, success state and server-error mapping (`useApiForm(schema, { submit, onSuccess })`);
  apps only lay out `FormInput`s and call `onSubmit`. If web and mobile forms differ in more than
  markup, the difference belongs in the hook.
- Features shipped: `auth` (session, account lifecycle forms), `preferences` (locale, theme),
  `todos` (reference CRUD: infinite list, optimistic toggle/delete, realtime), `notifications`
  (push device registration; unregistered on logout).
- One feature imports another only through its `index.ts`; `lib/` imports no feature
  (`pnpm lint:deps` enforces both).
- Export only what apps use; keep names consistent: `use<Entity>s`, `useCreate<Entity>`, `useUpdate<Entity>`, `useDelete<Entity>`, `<entity>FormSchema`.

## Realtime

`src/realtime`: one Socket.IO connection (`socket.io-client`, websocket transport, web + RN)
created by `setupCore`, connected by `useRealtimeConnection()` (mounted once in each app's
providers) while signed in. Handshake uses the current access token; on `unauthorized` it calls
`refreshSession()` and reconnects. Event names/payloads are typed from the generated
`RealtimeEvents`. To react to a new event:

- cache sync (most cases): add `features/<feature>/realtime.ts` exporting `RealtimeHandlers`
  (`{ "<event>": (payload, queryClient) => … }`) export it from the feature's `index.ts` and list it in `src/realtime/registry.ts`;
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
pnpm --filter @workspace/core typecheck | test
```
