# Fireweave — runtime credentials

This workspace is bound to staging Fireweave (`https://staging-app-server.fireweave.ai`).

Issue keys in the portal **Project settings → API keys**. Initialise does not mint them.

## Server surfaces (atlas-api, lantern-api, quay-api)

Set in the deploy environment (Compose / VM):

- `FW_API_URL` — `https://staging-app-server.fireweave.ai`
- `FW_PROJECT_API_KEY` — `project-api-key_…` from **Project API keys**

Local `APP_ENV=dev` uses the SDK **local** provider (no credentials).

## Web surfaces (atlas-web, lantern-web, quay-web)

Build-baked (Vite):

- `PUBLIC_FW_API_URL` or `VITE_FW_API_URL` — same staging host
- `PUBLIC_FW_PROJECT_API_KEY` or `VITE_FW_PROJECT_API_KEY` — `fw_public_…` from **Browser keys**

Vite `VITE_APP_ENV` / `APP_ENV` selects the tier (`dev` → local SDK, `prod`/`production` → remote).

Go prod remote mode is deferred until a Go SDK release is installable on the prod path; local mode is wired.
