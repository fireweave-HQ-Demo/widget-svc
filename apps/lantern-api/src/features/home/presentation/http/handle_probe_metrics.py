import json

from fireweave import EvaluationContext

from src.core.runtime_context import RuntimeContext
from src.features.health.application.get_health import get_health
from src.features.telemetry.infrastructure.start_otel import Telemetry
from src.fireweave.fw_harness import fw_control_points

METRIC_ADOPTED = "feature.home-probe.adopted"
METRIC_ERROR = "feature.home-probe.error"


def handle_probe_metrics(ctx: RuntimeContext, telemetry: Telemetry) -> tuple[int, bytes]:
    """Flag-gated probe that emits OTLP counters (collector → Oodle)."""
    # @fireweave-flag home-probe-metrics
    enabled = fw_control_points().get_boolean_value(
        "home-probe-metrics",
        False,
        EvaluationContext(targeting_key=ctx.service),
    )
    if not enabled:
        telemetry.increment(METRIC_ERROR)
        return 404, (json.dumps({"error": "home-probe-metrics disabled"}) + "\n").encode()

    try:
        health = get_health(ctx, telemetry.exporter_status)
        telemetry.increment(METRIC_ADOPTED)
        payload = {**health, "probeMetrics": True, "metric": METRIC_ADOPTED}
        return 200, (json.dumps(payload) + "\n").encode()
    except Exception as exc:  # noqa: BLE001 — emit error metric, never fail the read path
        telemetry.increment(METRIC_ERROR)
        return 500, (json.dumps({"error": str(exc)}) + "\n").encode()
