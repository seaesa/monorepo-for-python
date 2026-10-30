import type { ClientErrorCode } from "@workspace/api-client"

/**
 * English messages — the reference shape. Every key added here must also be added to vi.ts
 * (TypeScript enforces it). Interpolation: {{name}}. Plurals: key_one / key_other.
 */
const en = {
  common: {
    appName: "Todos",
    retry: "Retry",
    loading: "Loading…",
    signOut: "Sign out",
    settings: "Settings",
  },
  languages: {
    vi: "Tiếng Việt",
    en: "English",
  },
  settings: {
    language: "Language",
    theme: "Theme",
    themes: { system: "System", light: "Light", dark: "Dark" },
  },
  auth: {
    fields: {
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      fullName: "Full name",
    },
    login: {
      title: "Welcome back",
      description: "Sign in to manage your todos.",
      submit: "Sign in",
      submitting: "Signing in…",
      noAccount: "No account?",
      createOne: "Create one",
    },
    register: {
      title: "Create an account",
      description: "It takes less than a minute.",
      submit: "Create account",
      submitting: "Creating…",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
    },
  },
  todos: {
    title: "My todos",
    tab: "Todos",
    placeholder: "What needs to be done?",
    add: "Add",
    added: "Todo added",
    delete: "Delete",
    markDone: 'Mark "{{title}}" as done',
    markNotDone: 'Mark "{{title}}" as not done',
    filters: { all: "All", active: "Active", done: "Done" },
    empty: { title: "Nothing here", description: "Add your first todo above." },
    loadError: "Could not load todos",
    pagination: {
      page: "Page {{page}} of {{pages}}",
      total_one: "{{count}} todo",
      total_other: "{{count}} todos",
      previous: "Previous",
      next: "Next",
    },
  },
  profile: {
    title: "Profile",
    account: "Account",
    memberSince: "Member since {{date}}",
  },
  /**
   * Custom client rules + server-side validation keyed by Pydantic error type
   * (`FieldError.code`), interpolated with `FieldError.params`. Unlisted types fall back
   * to the server message.
   */
  validation: {
    passwordsMismatch: "Passwords do not match",
    missing: "This field is required",
    string_too_short: "Must be at least {{min_length}} characters",
    string_too_long: "Must be at most {{max_length}} characters",
    value_error: "Invalid value",
    greater_than_equal: "Must be at least {{ge}}",
    less_than_equal: "Must be at most {{le}}",
  },
  /**
   * One entry per backend `ErrorCode` (+ client codes). Type-checked: adding a code to the
   * backend enum and running `pnpm codegen` makes this file fail until it is translated.
   */
  errors: {
    bad_request: "Invalid request",
    http_error: "Request failed",
    invalid_credentials: "Invalid email or password",
    email_taken: "This email is already registered",
    account_disabled: "This account is disabled",
    invalid_token: "Your session has expired. Please sign in again.",
    unauthorized: "Please sign in to continue",
    forbidden: "You do not have permission to do this",
    not_found: "Not found",
    conflict: "This already exists",
    validation_error: "Please check the highlighted fields",
    network_error: "Cannot reach the server. Check your connection.",
    internal_error: "Something went wrong on our side",
    unknown_error: "Something went wrong",
  } satisfies Record<ClientErrorCode, string>,
}

export default en
