import type { RuntimeContext } from "../../../core/runtime-context";
import type { HealthReport } from "../domain/health-report";

export function getHealth(ctx: RuntimeContext): HealthReport {
  return {
    ok: true,
    service: ctx.service,
    environment: ctx.environment,
    destination: ctx.destination,
    framework: ctx.framework,
    exporter: { endpoint: ctx.exporterEndpoint, signals: ["traces", "logs", "metrics"] },
  };
}
