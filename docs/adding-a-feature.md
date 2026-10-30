# Adding a feature

The `todos` feature is the reference implementation: copy its shape. This walkthrough adds a
`notes` feature with the same moving parts.

## 1. Backend module

Create `apps/api/src/app/modules/notes/`:

| File            | Content                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| `models.py`     | `Note(UUIDPrimaryKeyMixin, TimestampMixin, Base)` with `owner_id` FK           |
| `schemas.py`    | `NoteRead`, `NoteCreate`, `NoteUpdate`, `NoteFilter(CursorParams)`             |
| `repository.py` | `NoteRepository(BaseRepository[Note])` with `list_for_owner(owner_id, params)` |
| `service.py`    | `NoteService(repository, session)` — commit after writes                       |
| `provider.py`   | `Provider(scope=Scope.REQUEST)` registering repository and service             |
| `router.py`     | `APIRouter(route_class=DishkaRoute)`, handlers named `verb_noun`               |
| `events.py`     | optional `NoteChanged(Event)` with `event_name = "notes.changed"`              |

Rules that the tests enforce or the review will:

- The service commits; the repository only flushes.
- Cross-module access goes through the other module's **service**.
- Every request/response model inherits `app.shared.schemas.Schema` (camelCase on the wire).
- Validation constraints live on the Pydantic fields — they become Zod rules in the clients.
- PATCH bodies: mark nullable columns as `| None`, and wrap non-nullable ones with
  `reject_null("field")` so an explicit `null` is a 422, not a database error.

Register it in `apps/api/src/app/modules/__init__.py` (`MODULE_PROVIDERS`, `MODULE_ROUTERS`, and
`REALTIME_EVENTS` if you added an event).

## 2. Migration

```bash
cd apps/api
uv run alembic revision --autogenerate -m "add notes"
uv run alembic upgrade head
uv run alembic check      # models and migrations must agree
```

Review the generated file: name constraints, add indexes for the columns you filter and order by,
and never edit an applied migration.

## 3. Tests

```bash
cd apps/api && uv run pytest tests/test_notes.py -q
```

Write the failing test first, and only for business rules: who may read or change a note
(per-owner isolation → 404), the domain errors your service raises, and any side effect (email,
push, event). Do not re-test what the shared layers already guarantee (the error envelope,
camelCase, 401 on a missing token). Fixtures: `client`, `auth_client`, `outbox`, `push_outbox`.

## 4. Regenerate the contract

```bash
pnpm codegen    # from the repo root; the API does not need to be running
```

Commit `packages/api-client`. CI fails if it is stale.

## 5. Shared logic in `packages/core`

`src/features/notes/`:

- `keys.ts` — query-key helpers (`noteListKeyPrefix()`), used for invalidation.
- `hooks.ts` — `useNoteList()` (cursor pagination + filters), mutations with optimistic updates.
- `schemas.ts` — the generated Zod schema plus UI-only fields (`confirmX`) and refinements.
- `forms.ts` — `useNoteComposerForm({ onCreated })` built on `useApiForm`: schema, defaults,
  submit, reset and server-error mapping, so both apps only render it.
- `realtime.ts` — cache updates for `note.changed`.
- `index.ts` — the public surface; add the subpath to `packages/core/package.json` `exports`.

Export `notesRealtime` from the feature's `index.ts` and list it in `src/realtime/registry.ts`.
Add a vitest next to a file only when it holds a decision (cache patching, rollback, mapping).

## 6. Text

Add keys to `packages/i18n/src/locales/en.ts` **and** `vi.ts`. No literal copy in components: the
`vi` file is typed against `en`, so a missing translation fails typecheck.

## 7. Screens

- Web: `apps/web/src/app/(app)/notes/page.tsx` + `apps/web/src/features/notes/components/`.
  Use `Skeleton` while pending, an `Empty` state, a `FormRootError` for non-field errors, and a
  confirmation dialog before destructive actions.
- Mobile: `apps/mobile/src/app/(app)/notes.tsx` + `apps/mobile/src/features/notes/components/`.
  Same hooks, `FlatList` with `onEndReached`, `RefreshControl`, and `Alert.alert` to confirm
  destructive actions.

Both call the same core hooks, so behaviour stays identical. If you find yourself writing the
same `useState`/`useEffect` in both screens, move it into the core hook.

## 8. Verify

```bash
pnpm codegen && git diff --exit-code packages/api-client
pnpm theme && git diff --exit-code packages/theme
pnpm check                   # format, lint, deps, spelling, duplication, knip, typecheck, tests
pnpm --filter web build
```

Then click through the flow once on web and on a device: there are no screen tests to do it
for you.
