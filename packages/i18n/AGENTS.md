# packages/i18n — translations for web and mobile (vi, en)

- `src/locales/en.ts` is the reference shape; `vi.ts` is typed against it (`Messages`), so a
  missing or extra key fails typecheck. Add every key to both files.
- `errors` is typed `Record<ClientErrorCode, string>` (backend `ErrorCode` enum + client codes):
  after a backend adds a code and `pnpm codegen` runs, typecheck fails until it is translated here.
- `validation.<pydanticType>` translates server-side 422 field errors (`string_too_short`, …),
  interpolated with the error `params` (`{{min_length}}`).
- Keys are grouped by feature (`auth`, `todos`, `profile`) + shared (`common`, `settings`,
  `languages`, `validation`, `errors`). Interpolation `{{name}}`, plurals `key_one` / `key_other`.
- `i18n` is a single, synchronously initialised instance (resources bundled). Language is driven by
  the preferences store in `@workspace/core` — never call `i18n.changeLanguage` from apps; use
  `usePreferencesStore().setLocale`. Server code (Next metadata) uses `i18n.getFixedT(locale)`.
- In components: `const { t } = useTranslation()` from `@workspace/i18n`. Messages that may be keys
  or plain text (form errors) render through `translateMessage()`.
- Adding a language: add it to `SUPPORTED_LOCALES`, create `locales/<lng>.ts`, map a date-fns locale
  in `packages/core/src/lib/date.ts` and a Zod locale in `features/preferences/store.ts`.
