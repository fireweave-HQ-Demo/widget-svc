import type { RuntimeContext } from "../../../core/runtime-context";
import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import { emitAllMetricTypes } from "../../../telemetry/infrastructure/emit-metric-types";

export async function handleProbeMetricTypes(
  ctx: RuntimeContext,
  telemetry: Telemetry,
): Promise<Response> {
  // @fireweave-controlpoint metric-types-probe
  try {
    const emitted = await emitAllMetricTypes(ctx);
    telemetry.increment("feature.metric-types.adopted");
    telemetry.record("feature.metric-types.histogram", 12.5);
    return Response.json({
      ok: true,
      feature: "metric-types-probe",
      emitted,
      types: ["counter", "updown", "gauge", "histogram", "exponential_histogram"],
    });
  } catch (err) {
    telemetry.increment("feature.metric-types.error");
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
