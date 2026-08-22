# FireWeave providers

This repo is environment-keyed (D26). The harness picks a branch from the
running environment **name** (`APP_ENV` / `VITE_APP_ENV`), not a bare
`NODE_ENV` boolean.

| Environment | Tier | Flags | Telemetry |
| ----------- | ---- | ----- | --------- |
| `prod` (default) | prod | Fireweave remote provider → fw-server `/v1/flags/evaluate` | Console / no-op — observability vendor not bound (INIT-B11 deferred) |
| unknown (`dev`, …) | `isProd()` fallback | Local in-memory provider when not classified prod | Console |

## Surfaces

- **ts-server** (`template-mirror/atlas-api`): `@fireweaveai/sdk` + `@fireweaveai/deploy-sdk`. Prod credentials: `FW_API_URL` (fallback `FW_ATTEST_URL`) + `FW_PROJECT_API_KEY`.
- **web** (`template-mirror/atlas-web`): `@fireweaveai/web-sdk` + `@fireweaveai/deploy-sdk`. Prod credentials: `PUBLIC_FW_API_URL` (fallback `PUBLIC_FW_ATTEST_URL`) + `PUBLIC_FW_PROJECT_API_KEY` (Vite also accepts `VITE_FW_*`).

Do not import flag providers from `@fireweaveai/deploy-sdk`. Do not route app OTLP through FireWeave.
