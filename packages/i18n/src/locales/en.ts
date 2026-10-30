import type { ClientErrorCode } from "@workspace/api-client"

/**
 * English messages — the reference shape. Every key added here must also be added to vi.ts
 * (TypeScript enforces it). Interpolation: {{name}}. Plurals: key_one / key_other.
 */
export const en = {
  common: {
    retry: "Retry",
    loading: "Loading…",
    cancel: "Cancel",
    signOut: "Sign out",
    settings: "Settings",
  },
  notFound: {
    title: "Page not found",
    description: "The page you are looking for does not exist or has moved.",
    home: "Back to todos",
  },
  error: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
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
      forgot: "Forgot password?",
    },
    register: {
      title: "Create an account",
      description: "It takes less than a minute.",
      submit: "Create account",
      submitting: "Creating…",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
    },
    verify: {
      title: "Verify your email",
      description: "We sent you a verification link. You can also paste the code from that email.",
      code: "Verification code",
      submit: "Verify email",
      submitting: "Verifying…",
      successTitle: "Email verified",
      successDescription: "Your account is ready to use.",
      continue: "Continue",
      resendHint: "Didn't get the email?",
      resend: "Send a new one",
      resent: "Sent. Check your inbox.",
    },
    forgot: {
      title: "Forgot your password?",
      description: "We'll email you a link to choose a new password.",
      submit: "Send reset link",
      submitting: "Sending…",
      sentTitle: "Check your inbox",
      sentDescription: "If an account exists for {{email}}, a reset link is on its way.",
      backToLogin: "Back to sign in",
    },
    reset: {
      title: "Choose a new password",
      description: "Your other sessions will be signed out.",
      submit: "Save password",
      submitting: "Saving…",
      successTitle: "Password updated",
      successDescription: "Sign in with your new password.",
      invalidToken: "This reset link is invalid or has expired.",
      requestNew: "Request a new link",
    },
    banner: {
      title: "Verify your email",
      description: "We sent a link to {{email}}. Some features stay locked until you confirm it.",
      resend: "Resend email",
      resent: "Verification email sent",
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
    loadMore: "Load more",
    deleteTitle: "Delete this todo?",
    deleteDescription: "This cannot be undone.",
  },
  appUpdate: {
    title: "Update required",
    description: "This version is no longer supported. Install the latest version to continue.",
    action: "Update now",
  },
  device: {
    title: "This device",
    sendTestPush: "Send a test notification",
    testPushQueued: "Sent. It arrives on every signed-in device that allowed notifications.",
    showLocation: "Show my location",
    coordinates: "Lat {{latitude}}, Lng {{longitude}}",
    location: { denied: "Location permission was denied", error: "Could not get your location" },
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
    invalid_cursor: "Invalid pagination cursor",
    value_error: "Invalid value",
    null_not_allowed: "This field cannot be empty",
    greater_than_equal: "Must be at least {{ge}}",
    less_than_equal: "Must be at most {{le}}",
  },
  /**
   * One entry per backend `ErrorCode` (+ client codes). Type-checked: adding a code to the
   * backend enum and running `pnpm codegen` makes this file fail until it is translated.
   */
  errors: {
    rate_limited: "Too many attempts. Try again later.",
    app_update_required: "This version of the app is no longer supported",
    bad_request: "Invalid request",
    http_error: "Request failed",
    invalid_credentials: "Invalid email or password",
    email_taken: "This email is already registered",
    account_disabled: "This account is disabled",
    email_not_verified: "Confirm your email address to continue",
    email_already_verified: "This email address is already confirmed",
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
