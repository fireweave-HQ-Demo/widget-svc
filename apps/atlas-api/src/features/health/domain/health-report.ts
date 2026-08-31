import type { RuntimeContext } from "../../../core/runtime-context";

export type HealthReport = {
  ok: true;
  service: string;
  environment: string;
  destination: string;
  exporter: { endpoint: string; status: "healthy" | "degraded"; signals: string[] };
};

export function toHealthReport(
  ctx: RuntimeContext,
  exporterStatus: "healthy" | "degraded",
): HealthReport {
  return {
    ok: true,
    service: ctx.service,
    environment: ctx.environment,
    destination: ctx.destination,
    exporter: {
      endpoint: ctx.exporterEndpoint,
      status: exporterStatus,
      signals: ["traces", "logs", "metrics"],
    },
  };
}
