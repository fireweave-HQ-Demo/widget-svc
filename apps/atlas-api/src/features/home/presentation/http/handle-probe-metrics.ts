import type { RuntimeContext } from "../../../core/runtime-context";
import { getHealth } from "../../../health/application/get-health";
import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import { fw } from "../../../../fireweave/fw-harness";
import { resolveInstanceTargetingKey } from "../../../../fireweave/fw-providers";

const METRIC_ADOPTED = "feature.home-probe.adopted";
const METRIC_ERROR = "feature.home-probe.error";

/** Flag-gated probe that emits OTLP counters (collector → Oodle). */
export async function handleProbeMetrics(
  ctx: RuntimeContext,
  telemetry: Telemetry,
): Promise<Response> {
  // @fireweave-flag home-probe-metrics
  const enabled = await fw.controlPoints.getBooleanValue(
    "home-probe-metrics",
    false,
    { targetingKey: resolveInstanceTargetingKey() },
  );
  if (!enabled) {
    telemetry.increment(METRIC_ERROR, { reason: "flag-off" });
    return Response.json({ error: "home-probe-metrics disabled" }, { status: 404 });
  }

  try {
    const health = getHealth(ctx, telemetry.exporterStatus);
    telemetry.increment(METRIC_ADOPTED, {
      surface: ctx.service,
      destination: ctx.destination,
    });
    return Response.json({
      ...health,
      probeMetrics: true,
      metric: METRIC_ADOPTED,
    });
  } catch (err) {
    telemetry.increment(METRIC_ERROR, {
      surface: ctx.service,
      reason: err instanceof Error ? err.message : "probe-failed",
    });
    return Response.json({ error: "probe failed" }, { status: 500 });
  }
}
