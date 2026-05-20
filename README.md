# widget-svc

Minimal Bun + Elysia service for FireWeave CI/CD deploy webhook demos.

- **Wrap-point:** `src/feature.ts` — `maybeNewBehavior()` reads `FLAG_KEY` via PostHog.
- **Deploy lane:** `.github/workflows/deploy.yml` emits `deployment_status` (`production`, `success`) on push to `main`.

## Local run

```bash
cp .env.example .env   # add POSTHOG_API_KEY if testing flags
bun install
bun run dev            # http://localhost:3101/health
```

## Cloud deploy (GitHub Actions → VM)

Add repository **secrets**: `SSH_HOST`=`217.216.59.25`, `SSH_USER`=`root`, `SSH_PASSWORD`.

One-time on the VM: run [`../scripts/server-bootstrap.sh`](../scripts/server-bootstrap.sh) (see [`../SETUP-WIDGETS.md`](../SETUP-WIDGETS.md)).

Default VM path: `/root/test/widget-svc`. Live: `http://217.216.59.25:3101/health`

## FireWeave wiring

See [`../SETUP-WIDGETS.md`](../SETUP-WIDGETS.md) for org ID, webhook URL, and `project_repos` (`fireweave-HQ-Demo/widget-svc`).
