import { defineConfig } from "@hey-api/openapi-ts"

// Source of truth: FastAPI. Regenerate with `pnpm codegen` after any backend
// schema/route change. Never edit files under src/gen by hand.
export default defineConfig({
  input: "./openapi.json",
  output: { path: "./src/gen", clean: true, tsConfigPath: null, module: { extension: "" } },
  plugins: [
    "@hey-api/typescript",
    { name: "@hey-api/client-axios", runtimeConfigPath: "./src/runtime-config" },
    { name: "@hey-api/sdk", validator: false },
    { name: "zod", requests: true, responses: true },
    { name: "@tanstack/react-query", queryOptions: true, mutationOptions: true, queryKeys: true },
  ],
})
