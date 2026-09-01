import type { RuntimeContext } from "../../../core/runtime-context";
import {
  increment,
  record,
  setGauge,
  upDown,
} from "../../telemetry/infrastructure/start-browser-otel";
import { fw } from "../../../fireweave/fw-harness";

const PREFIX = "metric.showcase";

/** Flag-gated browser emit of counter, histogram, up-down, and gauge. */
export async function runMetricShowcase(ctx: RuntimeContext): Promise<{
  ok: boolean;
  emitted: Record<string, string>;
  kinds: string[];
}> {
  // @fireweave-controlpoint metric-showcase
  const enabled = fw.controlPoints.getBooleanValue("metric-showcase", false);
  if (!enabled) {
    return { ok: false, emitted: {}, kinds: [] };
  }
  const started = performance.now();
  await upDown(ctx, `${PREFIX}.inflight`, 1);
  try {
    await increment(ctx, `${PREFIX}.requests`, 1);
    const latency = performance.now() - started;
    await record(ctx, `${PREFIX}.latency_ms`, latency);
    await setGauge(ctx, `${PREFIX}.queue_depth`, Math.round(latency % 10) + 1);
    return {
      ok: true,
      emitted: {
        counter: `${PREFIX}.requests`,
        histogram: `${PREFIX}.latency_ms`,
        upDown: `${PREFIX}.inflight`,
        gauge: `${PREFIX}.queue_depth`,
      },
      kinds: ["counter", "histogram", "up_down_counter", "gauge"],
    };
  } finally {
    await upDown(ctx, `${PREFIX}.inflight`, -1);
  }
}
