import type { RuntimeContext } from "../../../../core/runtime-context";
import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import { fw } from "../../../../fireweave/fw-harness";
import { resolveInstanceTargetingKey } from "../../../../fireweave/fw-providers";
import { emitAllMetricTypes } from "../../application/emit-all-metric-types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data) + "\n", {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** GET /metrics/showcase — flag-gated demo of counter, histogram, up-down, gauge. */
export async function handleMetricShowcase(
  _ctx: RuntimeContext,
  telemetry: Telemetry,
): Promise<Response> {
  // @fireweave-controlpoint metric-showcase
  const enabled = await fw.controlPoints.getBooleanValue("metric-showcase", false, {
    targetingKey: resolveInstanceTargetingKey(),
  });
  if (!enabled) {
    return json({ error: "metric-showcase disabled" }, 404);
  }
  const emitted = emitAllMetricTypes(telemetry);
  return json({
    ok: true,
    feature: "metric-showcase",
    emitted,
    kinds: ["counter", "histogram", "up_down_counter", "gauge"],
  });
}
