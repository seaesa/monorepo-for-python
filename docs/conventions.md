# Conventions

How to decide names, locations, comments and tests. The root `AGENTS.md` lists the rules; this
file shows the reasoning so you can apply it to cases it does not list.

## Before writing code: five questions

1. **Does it already exist?** Search `packages/core` (hooks, `lib/`), the generated client and the
   feature you are in. Extending an existing hook beats adding a sibling.
2. **Who owns the decision?** If the answer changes what data is stored or who may do what, it is a
   backend rule. The frontend only reflects it.
3. **Would both apps need it?** Then it is not app code: it goes to `packages/core` (behaviour) or
   `packages/i18n` / `packages/theme` (content, tokens).
4. **Is it about one feature or none?** One feature → `features/<feature>/`. No feature (a date
   formatter, a storage adapter) → `lib/`. Infrastructure several features plug into (the realtime
   socket) gets its own top-level folder in `packages/core/src`.
5. **What will the caller read?** Name it from the call site, after the outcome it gives.

## Naming decisions, worked through

### A hook

> "Mobile needs to register the device for push notifications when the user signs in."

- Registering the device is an API call both apps could make → the _mutation_ is
  `packages/core/src/features/notifications/hooks.ts`, named for the outcome: `useRegisterPushDevice`.
- Getting an Expo push token and listening to taps is mobile-only → `apps/mobile`.
  It belongs to the notifications feature, it is UI-side behaviour, not a component →
  `apps/mobile/src/features/notifications/hooks/use-push-registration.ts`, export `usePushRegistration`.
- The low-level token request is platform setup without React → `apps/mobile/src/lib/notifications.ts`.

> "A screen should refetch when it regains focus."

- Not tied to any feature, mobile-only, generic → `apps/mobile/src/hooks/use-refresh-on-focus.ts`.

Rules of thumb:

| Hook does…                                     | Lives in                                       | Name                                |
| ---------------------------------------------- | ---------------------------------------------- | ----------------------------------- |
| Server data for a feature (query or mutation)  | `packages/core/src/features/<f>/hooks.ts`      | `use<Entity>s`, `use<Verb><Entity>` |
| A form's state, submit and error mapping       | `packages/core/src/features/<f>/forms.ts`      | `use<Action>Form`                   |
| List state (filter + pagination) both apps use | `packages/core/src/features/<f>/hooks.ts`      | `use<Entity>List`                   |
| Platform behaviour for one feature             | `apps/<app>/src/features/<f>/hooks/use-<x>.ts` | `use<Behaviour>`                    |
| Platform behaviour for no feature              | `apps/<app>/src/hooks/use-<x>.ts`              | `use<Behaviour>`                    |

One hook per file in apps (the file is named after it). In `packages/core`, a feature's hooks
share `hooks.ts` until the file passes ~300 lines; then split by sub-domain (`hooks/session.ts`).

### A component

- Named after what it shows: `TodoList`, `UnverifiedBanner`, `DeviceSection` — not after
  where it is used (`ProfileBottom`) or how it looks (`BlueCard`).
- One exported component per file; small private sub-components may sit in the same file when
  only that component uses them.
- A component that needs data calls a core hook itself; do not thread query results down three
  levels of props.

### A function or variable

- Functions are verbs (`formatDate`, `applyServerErrors`, `resolveLocale`); values are nouns
  (`nextCursor`, `pageSize`).
- Booleans read as a question: `isPending`, `hasNextPage`, `canDelete`, `shouldRetry`.
- Units in the name when ambiguous: `timeoutMs`, `ttlSeconds`, `amountMinor`.
- Collections are plural (`todos`), maps say what maps to what (`titlesByToken`).
- Avoid generic names (`data`, `info`, `item`, `handle`, `utils`, `helpers`, `manager`) unless the
  scope is a few lines.

### A file or folder

- kebab-case for TS (`use-current-location.ts`), snake_case for Python (`push.py`).
- Folders are features or layers, never kinds of code at the top of a feature (`types/`,
  `constants/` folders inside a feature are a smell: keep a type next to its use).
- Do not create `index.ts` barrels inside apps. In `packages/core`, each feature's `index.ts` _is_
  its public API: export only what apps import.

### Backend

- Module = business capability (`todos`, `notifications`), plural noun.
- Classes: `<Entity>` model, `<Entity>Read/Create/Update/Filter` schemas,
  `<Entity>Repository`, `<Module>Service` (e.g. `NotificationService`).
- Route handler = `verb_noun` (`register_push_device`); it becomes the SDK function name, so
  pick it for the frontend reader too.
- Error codes: `snake_case` describing the condition, not the HTTP status (`email_taken`, not
  `conflict_1`).

## Comments

Write a comment when a competent reader would otherwise ask "why?" or make a wrong change:

```ts
// Re-run on locale change: the server renders pushes in the language of the last registration.
useEffect(() => { … }, [isAuthenticated, locale, register])
```

```py
# Delete before the insert: the token unique index would otherwise reject a device that
# changed user.
```

Do not write:

```ts
// Get the current user
const user = useCurrentUser()

// TODO: improve this
```

- Doc comments (`/** … */`, docstrings) on exported functions of shared packages when the
  signature does not tell the whole story (preconditions, side effects, idempotency).
- A workaround names its reason and, if any, the upstream issue URL.
- Comments are English, full sentences, and kept true: changing the code means changing them.

## Tests

Ask: _if this broke in production, would a user lose data, access, money or trust, or see the
wrong thing?_ If yes, test it at the lowest layer that owns the rule. If no, don't.

| Worth a test                                                     | Not worth a test                                  |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| A user cannot read or change another user's todo                 | A button renders                                  |
| Changing the password signs out every device and stops pushes    | A component passes props through                  |
| A duplicate email answers `409 email_taken` on the `email` field | The generated client builds the right URL         |
| A 401 triggers one refresh for many concurrent requests          | Tailwind classes                                  |
| Pagination returns every row exactly once                        | Zod accepts a valid email (the library is tested) |
| A server error lands under the right form field, translated      | A getter returns its field                        |

Name tests as the behaviour, in English: `test_token_moves_to_the_last_user`,
`it("puts a domain error tied to a field under that field")`.

## Code style

Formatting, import order and most style rules are enforced by oxfmt, oxlint and ruff. Beyond
what tools check:

- Early returns over nested conditionals; no nested ternaries (lint enforces).
- Functions with more than four parameters take an options object.
- Prefer `interface` for object shapes and `type` for unions; derive types from the generated
  client (`TodoRead`, `Pick<TodoUpdate, "title">`) instead of redeclaring them.
- No `any`, no non-null `!` outside tests, no `as` casts to silence the compiler; fix the type.
- Errors: let them propagate to the layer that can show or translate them. Do not swallow with an
  empty `catch` unless the operation is explicitly best-effort, and say so in the name or a comment.
- Async: every promise is awaited, returned or explicitly `void`-ed with a reason.
- Python: type every function (mypy strict), `structlog` instead of `print`, no bare `except`.
