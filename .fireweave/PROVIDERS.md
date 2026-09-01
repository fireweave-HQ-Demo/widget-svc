# FireWeave providers (stg_bench)

| Tier | Environment signal | Flag provider | Notes |
| --- | --- | --- | --- |
| **dev** | `APP_ENV=dev` / `VITE_APP_ENV=dev` | FireWeave local (in-process) | No credentials required |
| **prod** | `APP_ENV=prod` / `VITE_APP_ENV=prod` | FireWeave remote → fw-server | Requires `FW_*` / `PUBLIC_FW_*` pairs |

Observability query leg: **Oodle** (metrics, logs, traces). App export leg: OTLP to bench collector via `OTEL_EXPORTER_OTLP_ENDPOINT` / `VITE_OTEL_PORT`.

PostHog project (flags): `534547` on environment **prod**.
