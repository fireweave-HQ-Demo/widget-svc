# FireWeave providers (this repo)

Environment-keyed tiers (D26). The harness picks a flag provider from the
**running environment name**, not a bare `NODE_ENV` boolean.

| Environment | Tier | Flag provider |
| ----------- | ---- | ------------- |
| `dev` | `dev` | SDK local / in-memory (`makeDevProvider` / `make_dev_provider`) |
| `prod` | `prod` | Connected vendor via fw-server remote adapter (`makeConnectedVendorProvider` / `make_connected_vendor_provider`) |

`FW_DEFAULT_ENV` in each harness is `dev` (used when no env signal is set).
Project `defaultEnvironment` / `promotionEnvironment` are `prod`.

## Credentials (operator-issued — never committed)

| Surface | Variables |
| ------- | --------- |
| ts-server / python | `FW_API_URL`, `FW_PROJECT_API_KEY` |
| web | `PUBLIC_FW_API_URL`, `PUBLIC_FW_PROJECT_API_KEY` (Vite may also accept `VITE_*` aliases) |

See `fireweave.md` at the repo root for the full env contract.

## PostHog

- `posthogProjectId`: `534547` (prod-tier binding)
- Flags evaluate through FireWeave → fw-server; apps do **not** embed PostHog keys for control points.

## Observability

FireWeave does **not** initialise telemetry. Each surface keeps its own OTLP client
(see `.fireweave/agent-instructions.md` → How to emit a metric).
