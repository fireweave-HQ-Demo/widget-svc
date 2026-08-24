# FireWeave providers (this repo)

Initialised against FireWeave project **wesredtrfytg**. The harness selects a
branch from the **running environment name** (`APP_ENV` / `VITE_APP_ENV`), not a
bare `NODE_ENV` boolean.

| Environment | Tier | Flags | Telemetry |
| ----------- | ---- | ----- | --------- |
| `prod` | prod | FireWeave remote (`initFireweave({ mode: 'remote' })`) via fw-server `/v1/flags/evaluate`. PostHog project `393610` is the connected flag backend. | OpenObserve is bound for query. App export is **direct OTLP** to OpenObserve (`OTEL_EXPORTER_OTLP_ENDPOINT` = `https://<host>/api/<org>` with **no trailing slash**; `OTEL_EXPORTER_OTLP_HEADERS` = `Authorization=Basic <base64(email:password)>`). This repo already ships an OTel collector → OpenObserve path; the harness does not proxy ingest through FireWeave. |
| unknown / `dev` (compose local) | fallback | FireWeave local in-memory map (`mode: 'local'`) + console. No credentials. | Existing app console/collector exporters. |

`isProd()` is only the unknown-env fallback and the token `verify_prod_path` greps for.

Prod flags credentials (pair; never commit the key):

- API: `FW_API_URL` / `FW_ATTEST_URL` + `FW_PROJECT_API_KEY`
- Web (build-baked): `PUBLIC_FW_API_URL` / `VITE_FW_API_URL` + `PUBLIC_FW_PROJECT_API_KEY` / `VITE_FW_PROJECT_API_KEY`
