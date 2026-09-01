# FireWeave providers — prod_dd_bench

Environment-keyed harness (D26). The running environment **name** selects the tier via `FW_ENV_PROFILES` in each surface's `fw-providers` module.

| Tier | Flag provider | Telemetry |
| --- | --- | --- |
| **dev** (`APP_ENV=dev` / `VITE_APP_ENV=dev`) | FireWeave local (in-memory, no credentials) | App-owned OTLP → bench collector → Datadog |
| **prod** (`APP_ENV=prod` / `VITE_APP_ENV=prod`) | FireWeave remote → fw-server `/v1/flags/evaluate` → PostHog (`534542`) | App-owned OTLP → bench collector → Datadog |

## Prod credentials (docker_compose)

Set in `infra/remote/prod/docker-compose.yml` per service:

- **Server surfaces** (`atlas-api`, `lantern-api`): `FW_API_URL`, `FW_PROJECT_API_KEY`
- **Web surfaces** (`atlas-web`, `lantern-web`): `PUBLIC_FW_API_URL`, `PUBLIC_FW_PROJECT_API_KEY` (or `VITE_*` equivalents at build time)

See [fireweave.md](../fireweave.md) for issuance instructions. Initialise mints nothing.

## Observability query leg (fw-server)

Datadog metrics/logs/traces bound for guardrail queries during ramps (`connectionId` on prod env). Export leg (OTLP endpoint) is operator-owned — already wired via `OTEL_EXPORTER_OTLP_ENDPOINT`.
