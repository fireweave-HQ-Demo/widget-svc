import {
  listenPort,
  loadRuntimeFromEnv,
} from "../features/runtime/infrastructure/env-runtime";
import { startOtel } from "../features/telemetry/infrastructure/start-otel";
import { createJsonIdentityStore } from "../features/identity/infrastructure/json-identity-store";
import type { IdentityStore } from "../features/identity/application/ports/identity-store";

/** Composition-only wiring for runtime + OTLP (used by main). */
export function bootstrap(defaultPort: number) {
  const ctx = loadRuntimeFromEnv("atlas-api");
  const telemetry = startOtel(ctx);
  const port = listenPort(defaultPort);
  const identityEnabled = Bun.env.IDENTITY_ENABLED === "true";
  const identity: IdentityStore = createJsonIdentityStore({
    enabled: identityEnabled,
    seedPath: Bun.env.IDENTITY_SEED_PATH ?? "/data/identity/seed.json",
  });
  return { ctx, telemetry, port, identity };
}
