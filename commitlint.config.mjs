/**
 * Conventional Commits: `type(scope): subject`, e.g. `feat(todos): add completed filter`.
 * Scope is optional; when present it must name a workspace, a feature or a repo-wide area.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "api",
        "web",
        "mobile",
        "core",
        "api-client",
        "i18n",
        "theme",
        "auth",
        "users",
        "todos",
        "realtime",
        "ci",
        "deps",
        "docs",
        "tooling",
        "release",
      ],
    ],
    "subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]],
    "body-max-line-length": [1, "always", 100],
  },
}
