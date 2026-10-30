const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*", "expo-env.d.ts"] },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@hugeicons/core-free-icons",
              message:
                'Metro does not tree-shake: import each icon, e.g. `import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"`.',
            },
          ],
        },
      ],
    },
  },
])
