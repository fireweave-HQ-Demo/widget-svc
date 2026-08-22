import {
  listenPort,
  loadRuntimeFromEnv,
} from "../features/runtime/infrastructure/env-runtime";
import { startOtel } from "../features/telemetry/infrastructure/start-otel";

/** Composition-only wiring for runtime + OTLP (used by main). */
export function bootstrap(defaultPort: number) {
  const ctx = loadRuntimeFromEnv("harbor-api");
  const telemetry = startOtel(ctx);
  const port = listenPort(defaultPort);
  return { ctx, telemetry, port };
}
