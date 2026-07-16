# FireWeave providers (widget-svc)

| Tier | Flags | Telemetry |
|------|-------|-----------|
| **dev** (local / unknown non-prod) | FireWeave in-memory OpenFeature (`FireweaveLocalProvider`) | OTel console exporters |
| **prod** (`FW_ENV=prod`) | Connected PostHog OpenFeature (`POSTHOG_PROJECT_API_KEY` + `POSTHOG_HOST`) | Direct OTLP to bound vendor (no FireWeave proxy) |

## Environments

| Environment | Tier | PostHog project |
|-------------|------|-----------------|
| `prod` (default) | prod | `393610` |

Set `FW_ENV=prod` in the production runtime so harness classification and the boot beacon agree.

## Credentials

| Surface | Credential env | Host env |
|---------|----------------|----------|
| ts-server | `POSTHOG_PROJECT_API_KEY` | `POSTHOG_HOST` |

Boot beacon (prod-tier only): `FW_ATTEST_URL` + `FW_PROJECT_API_KEY`.
