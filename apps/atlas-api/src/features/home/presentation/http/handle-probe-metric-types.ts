import type { RuntimeContext } from "../../../core/runtime-context";
import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import { fw } from "../../../../fireweave/fw-harness";
import { resolveInstanceTargetingKey } from "../../../../fireweave/fw-providers";

const METRIC_ADOPTED = "feature.metric-types.adopted";
const METRIC_ERROR = "feature.metric-types.error";
const METRIC_COUNTER = "feature.metric-types.counter";
const METRIC_GAUGE = "feature.metric-types.gauge";
const METRIC_HISTOGRAM = "feature.metric-types.histogram";
const METRIC_UPDOWN = "feature.metric-types.updown";
const METRIC_EXP_HISTOGRAM = "feature.metric-types.exponential_histogram";

/** Emit every OTLP metric instrument type when the flag is on. */
export async function handleProbeMetricTypes(
  ctx: RuntimeContext,
  telemetry: Telemetry,
): Promise<Response> {
  // @fireweave-flag metric-types-probe
  const enabled = await fw.controlPoints.getBooleanValue(
    "metric-types-probe",
    false,
    { targetingKey: resolveInstanceTargetingKey() },
  );
  if (!enabled) {
    telemetry.increment(METRIC_ERROR, { reason: "flag-off" });
    return Response.json({ error: "metric-types-probe disabled" }, { status: 404 });
  }

  try {
    telemetry.increment(METRIC_COUNTER, { surface: ctx.service });
    telemetry.setGauge(METRIC_GAUGE, 42, { surface: ctx.service });
    telemetry.record(METRIC_HISTOGRAM, 12.5, { surface: ctx.service });
    telemetry.addUpDown(METRIC_UPDOWN, 1, { surface: ctx.service });
    await telemetry.emitExponentialHistogram(METRIC_EXP_HISTOGRAM, 8, {
      surface: ctx.service,
    });
    telemetry.increment(METRIC_ADOPTED, { surface: ctx.service });

    return Response.json({
      ok: true,
      service: ctx.service,
      environment: ctx.environment,
      destination: ctx.destination,
      metricTypes: [
        "counter",
        "gauge",
        "histogram",
        "updown_counter",
        "exponential_histogram",
      ],
      metrics: [
        METRIC_COUNTER,
        METRIC_GAUGE,
        METRIC_HISTOGRAM,
        METRIC_UPDOWN,
        METRIC_EXP_HISTOGRAM,
        METRIC_ADOPTED,
      ],
    });
  } catch (err) {
    telemetry.increment(METRIC_ERROR, {
      surface: ctx.service,
      reason: err instanceof Error ? err.message : "probe-failed",
    });
    return Response.json({ error: "metric types probe failed" }, { status: 500 });
  }
}
