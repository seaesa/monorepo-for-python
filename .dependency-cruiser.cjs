/**
 * Architecture boundaries (see AGENTS.md › Architecture). Each rule encodes a layering decision;
 * fix the import, do not add exceptions here without updating AGENTS.md.
 * @type {import("dependency-cruiser").IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular imports hide coupling and break tree-shaking and HMR.",
      from: {},
      to: { circular: true },
    },
    {
      name: "packages-not-to-apps",
      severity: "error",
      comment: "Shared packages are app-agnostic: an app depends on a package, never the reverse.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "no-cross-app",
      severity: "error",
      comment: "Apps never import each other. Move shared code to packages/core.",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/", pathNot: "^apps/$1/" },
    },
    {
      name: "api-client-is-leaf",
      severity: "error",
      comment: "The generated contract depends on nothing in the workspace.",
      from: { path: "^packages/api-client/" },
      to: { path: "^packages/(?!api-client/)" },
    },
    {
      name: "theme-is-leaf",
      severity: "error",
      comment: "Design tokens depend on nothing in the workspace.",
      from: { path: "^packages/theme/" },
      to: { path: "^packages/(?!theme/)" },
    },
    {
      name: "i18n-only-to-contract",
      severity: "error",
      comment: "Messages may reference generated types (ErrorCode) but no logic.",
      from: { path: "^packages/i18n/" },
      to: { path: "^packages/(?!i18n/|api-client/)" },
    },
    {
      name: "core-feature-isolation",
      severity: "error",
      comment:
        "A core feature uses another feature only through its public index.ts, never its internals.",
      from: { path: "^packages/core/src/features/([^/]+)/" },
      to: {
        path: "^packages/core/src/features/([^/]+)/(?!index\\.ts$)",
        pathNot: "^packages/core/src/features/$1/",
      },
    },
    {
      name: "core-lib-is-pure",
      severity: "error",
      comment:
        "core/lib holds feature-agnostic helpers; it must not depend on features or realtime.",
      from: { path: "^packages/core/src/lib/" },
      to: { path: "^packages/core/src/(features|realtime)/" },
    },
    {
      name: "shared-ui-not-to-features",
      severity: "error",
      comment:
        "components/, lib/, hooks/ are generic building blocks; only the providers.tsx composition root may mount features.",
      from: {
        path: "^apps/[^/]+/src/(components|lib|hooks)/",
        pathNot: "^apps/[^/]+/src/components/providers\\.tsx$",
      },
      to: { path: "^apps/[^/]+/src/features/" },
    },
    {
      name: "not-to-test",
      severity: "error",
      comment: "Production code never imports test files.",
      from: { pathNot: "\\.test\\.tsx?$" },
      to: { path: "\\.test\\.tsx?$" },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment: "Runtime code must not import a devDependency; it would be missing in production.",
      from: {
        path: "^(apps|packages)/[^/]+/src/",
        pathNot: ["\\.test\\.tsx?$", "^packages/[^/]+/src/test/"],
      },
      to: { dependencyTypes: ["npm-dev"], dependencyTypesNot: ["type-only", "npm-peer"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: ["/gen/", "/generated/", "\\.d\\.ts$", "/\\.next/", "/\\.expo/"] },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
}
