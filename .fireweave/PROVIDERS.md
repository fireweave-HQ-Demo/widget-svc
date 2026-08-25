# FireWeave providers (this repo)

| Tier | Flags | Telemetry |
|------|-------|-----------|
| **dev** (unknown / non-prod fallback) | `@fireweaveai/*-sdk` `mode: 'local'` — in-memory control points | App-owned OTLP (OpenObserve via collector). FireWeave does not wire exporters. |
| **prod** (`prod`) | Fireweave remote → fw-server `/v1/flags/evaluate` via `FW_*` / `PUBLIC_FW_*` / `VITE_FW_*` | App-owned OTLP → collector → OpenObserve (query leg bound in FireWeave). |

Environment signal: `APP_ENV` (api) / `VITE_APP_ENV` (web). Profile map: `prod` → prod tier. Default env: `prod`.
