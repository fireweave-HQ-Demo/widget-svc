import type { Telemetry } from "../../../telemetry/application/ports/telemetry";

/** Flag-gated enhanced probe — emits home-probe OTLP counters. */
export function handleProbeMetrics(telemetry: Telemetry): Response {
  // @fireweave-controlpoint home-probe-metrics
  try {
    telemetry.increment("feature.home-probe.adopted");
    return Response.json({
      ok: true,
      feature: "home-probe-metrics",
      emitted: ["feature.home-probe.adopted"],
    });
  } catch (err) {
    telemetry.increment("feature.home-probe.error");
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
