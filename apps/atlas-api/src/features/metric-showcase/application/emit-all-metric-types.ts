import type { Telemetry } from "../../../telemetry/application/ports/telemetry";

const PREFIX = "metric.showcase";

/** Emit one sample of each OTLP instrument kind for guardrail/adoption demos. */
export function emitAllMetricTypes(telemetry: Telemetry): {
  counter: string;
  histogram: string;
  upDown: string;
  gauge: string;
} {
  const started = performance.now();
  telemetry.upDown(`${PREFIX}.inflight`, 1, { surface: "ts-server" });
  try {
    telemetry.increment(`${PREFIX}.requests`, { surface: "ts-server" });
    const latency = performance.now() - started;
    telemetry.record(`${PREFIX}.latency_ms`, latency, { surface: "ts-server" });
    telemetry.setGauge(`${PREFIX}.queue_depth`, Math.round(latency % 10) + 1, {
      surface: "ts-server",
    });
    return {
      counter: `${PREFIX}.requests`,
      histogram: `${PREFIX}.latency_ms`,
      upDown: `${PREFIX}.inflight`,
      gauge: `${PREFIX}.queue_depth`,
    };
  } finally {
    telemetry.upDown(`${PREFIX}.inflight`, -1, { surface: "ts-server" });
  }
}
