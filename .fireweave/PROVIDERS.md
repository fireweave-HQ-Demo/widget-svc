# Dev tier — local provider (in-memory, no credentials)
- **Branch:** `makeDevProvider()` / `make_dev_provider()` when `APP_ENV=dev` (or `VITE_APP_ENV=dev` for web)
- **Flags:** seeded in harness `local.controlPoints` for local dogfooding only

# Prod tier — connected vendor via FireWeave
- **Branch:** `makeConnectedVendorProvider()` when `APP_ENV=prod`
- **Server credentials:** `FW_API_URL` + `FW_PROJECT_API_KEY` (from portal → Project API keys)
- **Web credentials:** `PUBLIC_FW_API_URL` + `PUBLIC_FW_PROJECT_API_KEY` (from portal → Browser keys)
- **PostHog project:** `534547` (prod environment binding)
- **Observability query:** Datadog (`connectionId: e6b994b6-36ee-49b9-bfad-d8bedc9fdf57`) — query leg only; export leg is operator-supplied OTLP vars in deploy

See [fireweave.md](../fireweave.md) for credential setup.
