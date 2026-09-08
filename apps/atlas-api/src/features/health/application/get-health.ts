import type { RuntimeContext } from "../../../core/runtime-context";
import { toHealthReport, type HealthReport } from "../domain/health-report";

export function getHealth(
  ctx: RuntimeContext,
  exporterStatus: "healthy" | "degraded",
): HealthReport {
  return toHealthReport(ctx, exporterStatus);
}
