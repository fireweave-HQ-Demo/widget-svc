import {
  createRuntimeContext,
  type RuntimeContext,
} from "../../../core/runtime-context";

/** Infrastructure: load runtime from process env (no domain imports of process.env). */
export function loadRuntimeFromEnv(service: string): RuntimeContext {
  return createRuntimeContext({
    service,
    environment: process.env.APP_ENV ?? "dev",
    destination: process.env.BENCH_DESTINATION ?? "control",
    exporterEndpoint:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://collector:4318",
  });
}

export function listenPort(fallback: number): number {
  return Number(process.env.PORT ?? fallback);
}
