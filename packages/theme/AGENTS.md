# packages/theme — design tokens (single source for web + mobile)

`src/tokens.ts` is the **only** place colors (light/dark), radius scale and the font family
are defined. `pnpm theme` (repo root) generates:

| Output                                  | Consumer                                                             | Convention                                                              |
| --------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/generated/web.css`                 | `apps/web/src/styles/globals.css`                                    | shadcn: `:root` / `.dark` raw vars + `@theme inline` → `bg-background`… |
| `src/generated/native.css`              | `apps/mobile/src/global.css`                                         | Uniwind: `@layer theme { :root { @variant light/dark { --color-* } } }` |
| `src/generated/colors.ts` (`hexColors`) | mobile APIs that cannot read CSS (React Navigation theme, StatusBar) | hex                                                                     |

Two CSS files are generated (not one shared file) because the two runtimes need different
syntax: shadcn components and the shadcn CLI expect `.dark` class variables; Uniwind has no DOM
and reads `@variant` blocks. Values are identical by construction.

## Rules

- Never edit `src/generated/*`. Never define tokens (`:root`, `.dark`, `@variant light|dark`,
  `--color-*`, `--radius`, token names) in app stylesheets — `scripts/check.ts` fails on it (CI).
- Token names follow shadcn (`background`, `mutedForeground`, `sidebarPrimary`, `chart1`…), so
  components added by the shadcn / React Native Reusables CLIs pick them up without CSS changes.
  If a new component needs a token that does not exist, add it here, never in the app.
- Changing the palette = edit `colors` (oklch). Changing the _style_ (component shapes like maia's
  pill buttons) is not a token concern: it lives in the component classes of each app.
- The font must support Vietnamese. Changing it means updating `fontFamily`, `next/font` in
  `apps/web/src/app/layout.tsx` and the expo-font definitions in `apps/mobile/src/lib/fonts.ts`.

```bash
pnpm theme                                   # generate + integrity check
pnpm --filter @workspace/theme check         # check only
```
