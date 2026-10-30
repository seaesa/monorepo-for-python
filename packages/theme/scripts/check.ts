/**
 * Integrity guard: design tokens may only be defined in src/tokens.ts.
 * The shadcn / React Native Reusables CLIs write CSS variables into the app stylesheets
 * when adding some components; those values would silently override the shared theme.
 * Fails (CI) if an app stylesheet defines a token or a theme block.
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { colors } from "../src/tokens.ts"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const STYLESHEETS = ["apps/web/src/styles/globals.css", "apps/mobile/src/global.css"]

const kebab = (token: string) => token.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase()
const tokenNames = Object.keys(colors.light).map(kebab)

const rules: [RegExp, string][] = [
  [/(^|[\s,}])(:root|\.dark)(:root)?\s*\{/m, "theme selector (:root / .dark)"],
  [/@variant\s+(light|dark)\b/, "@variant light/dark block"],
  [/--color-[a-z0-9-]+\s*:/, "--color-* definition"],
  [new RegExp(`--(${tokenNames.join("|")}|radius)\\s*:`), "token definition"],
]

let failed = false
for (const file of STYLESHEETS) {
  const css = readFileSync(root + file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  for (const [pattern, what] of rules) {
    const match = css.match(pattern)
    if (match) {
      failed = true
      console.error(`✖ ${file}: ${what} found ("${match[0].trim()}").`)
    }
  }
}

if (failed) {
  console.error(
    "\nMove these values into packages/theme/src/tokens.ts and run `pnpm theme` " +
      "(a CLI may have written them when adding a component)."
  )
  process.exit(1)
}
console.log("Theme integrity OK: app stylesheets only import @workspace/theme.")
