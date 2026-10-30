/**
 * Pre-commit checks on staged files only (fast). Full checks run in CI.
 * ESLint runs from each workspace so its own config (and ESLint version) is used.
 */
const quote = (files) => files.map((f) => JSON.stringify(f)).join(" ")

const eslint = (dir) => (files) =>
  `pnpm --dir ${dir} exec eslint --fix --max-warnings=0 --no-warn-ignored ${quote(files)}`

export default {
  "*.{js,mjs,cjs,ts,tsx,json,css,md,yml,yaml}": "prettier --write --ignore-unknown",
  "apps/web/**/*.{js,mjs,ts,tsx}": eslint("apps/web"),
  "apps/mobile/**/*.{js,ts,tsx}": eslint("apps/mobile"),
  "packages/core/**/*.{ts,tsx}": eslint("packages/core"),
  "packages/i18n/**/*.ts": eslint("packages/i18n"),
  "packages/theme/**/*.ts": eslint("packages/theme"),
  "packages/api-client/src/*.ts": eslint("packages/api-client"),
  "apps/api/**/*.py": (files) => [
    `uv run --project apps/api ruff check --fix ${quote(files)}`,
    `uv run --project apps/api ruff format ${quote(files)}`,
  ],
}
