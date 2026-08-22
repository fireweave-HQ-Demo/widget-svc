import {
  createRuntimeContext,
  type RuntimeContext,
} from "../../../core/runtime-context";

/** Infrastructure: load runtime from process env (no domain imports of Bun.env). */
export function loadRuntimeFromEnv(service: string): RuntimeContext {
  return createRuntimeContext({
    service,
    environment: Bun.env.APP_ENV ?? "dev",
    destination: Bun.env.BENCH_DESTINATION ?? "control",
    exporterEndpoint:
      Bun.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://collector:4318",
  });
}

export function listenPort(fallback: number): number {
  return Number(Bun.env.PORT ?? fallback);
}
