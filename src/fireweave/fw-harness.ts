/**
 * fw-harness.ts — scaffolded by `/fireweave:initialise` (TS-server surface).
 *
 * The "promote, not wrap" harness (D26): BOTH branches are present and the
 * RUNNING ENVIRONMENT — resolved by NAME, not a bare boolean — selects which one
 * is live. Nothing is swapped at promotion — `safe-rollout-fast` runs
 * `verify_prod_path` and ramps via `flag.control`; it never mutates this file.
 *
 * Environment-keyed model (D26): `FW_ENV_PROFILES` maps every environment the
 * project declares in FireWeave (`list_project_environments`) — here only `prod`
 * (prod-tier) — to a TIER. `dev`-tier binds the in-memory FireWeave local
 * provider + console exporters; `prod`-tier binds the connected vendor's real
 * provider + direct OTLP + the boot beacon.
 *
 * `initFwHarness()` MUST be the FIRST awaited statement in the app entrypoint
 * so the provider + OTel + the stamp beacon are live before any flag read or
 * instrumented path runs. `verify_prod_path` asserts exactly that.
 *
 * Set `FW_ENV=prod` in the production runtime so classification and attestation
 * agree (beacon scopes off `FW_ENV`).
 */
import { OpenFeature } from '@openfeature/server-sdk';
import {
  isProd,
  initFwTelemetry,
  registerFwFlagHooks,
} from '@fireweaveai/deploy-sdk/flags';
import { initFwAttestation } from '@fireweaveai/deploy-sdk';
import { resolveBootBeaconFromEnv } from '@fireweaveai/deploy-sdk/attest';
import { makeConnectedVendorProvider, makeDevProvider } from './fw-providers';
import { FW_STAMPS } from './fw-tracker';

type FwEnvTier = 'dev' | 'prod';

/**
 * Per-environment harness profile — regenerated from `list_project_environments`.
 * `FW_DEFAULT_ENV` is the project's `defaultEnvironment`.
 */
const FW_DEFAULT_ENV = 'prod';
const FW_ENV_PROFILES: Record<string, { tier: FwEnvTier }> = {
  prod: { tier: 'prod' },
};

/**
 * Resolve the running environment NAME. `FW_ENV` is the canonical selector — it
 * ALSO scopes the boot beacon (`resolveBootBeaconFromEnv` reads it), so keep them
 * aligned per environment. `NODE_ENV` is the fallback; else the project default.
 */
function resolveFwEnvName(env: Record<string, string | undefined>): string {
  return env.FW_ENV ?? env.NODE_ENV ?? FW_DEFAULT_ENV;
}

export async function initFwHarness(): Promise<void> {
  const fwEnvName = resolveFwEnvName(process.env);
  const profile = FW_ENV_PROFILES[fwEnvName];
  // Unknown environment is NOT silently folded into dev/prod — fall back to the
  // isProd() tier probe and WARN so the operator adds an explicit profile row.
  const prod = profile ? profile.tier === 'prod' : isProd(process.env);
  if (!profile) {
    console.warn(
      `[fireweave] environment '${fwEnvName}' has no FW_ENV_PROFILES entry; ` +
        `classified as '${prod ? 'prod' : 'dev'}' via isProd() fallback. ` +
        `Run /fireweave:initialise --reinit or add it to FW_ENV_PROFILES.`
    );
  }

  // 1. Telemetry: dev-tier → console exporters; prod-tier → per-signal OTLP DIRECT
  //    to the vendor. Observability query is bound to Sentry; no OTLP ingest
  //    descriptor was returned from get_project_capabilities — signals left empty.
  initFwTelemetry(prod ? 'rollout' : 'dev', {
    serviceName: 'widget-svc',
  });
  registerFwFlagHooks();

  // 2. Flags: prod-tier → connected PostHog provider; unknown/dev → local provider.
  const provider = prod ? makeConnectedVendorProvider() : makeDevProvider();
  await OpenFeature.setProviderAndWait(provider);

  // 3. Boot beacon: attest active change stamps, scoped by `FW_ENV`.
  //    Requires FW_ATTEST_URL + FW_PROJECT_API_KEY in the prod-tier runtime env.
  initFwAttestation({
    stamps: FW_STAMPS,
    ...resolveBootBeaconFromEnv({ env: process.env, prod }),
  });
}
