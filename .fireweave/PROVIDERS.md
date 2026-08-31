# FireWeave providers — dd_react_python

| Tier | Flag provider | Credentials |
| --- | --- | --- |
| **dev** (`APP_ENV=dev`, `VITE_APP_ENV=dev`) | FireWeave local (in-memory) | None |
| **prod** (`APP_ENV=prod`, `VITE_APP_ENV=prod`) | FireWeave remote → PostHog via fw-server | See `fireweave.md` |

PostHog project id (prod): `534542`

Observability query leg (fw-server guardrails): Datadog (`observability.query.metrics` bound). App export leg: OTLP → bench collector → Datadog (operator-managed `OTEL_EXPORTER_OTLP_ENDPOINT`).

Do not route app telemetry through FireWeave. Do not swap providers at promotion time.
