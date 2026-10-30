import type { CreateClientConfig } from "./gen/client.gen"

// Defaults applied when the generated client is instantiated.
// Per-app values (baseURL, auth) are set at runtime via `configureApiClient`.
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  throwOnError: true,
  timeout: 15_000,
})
