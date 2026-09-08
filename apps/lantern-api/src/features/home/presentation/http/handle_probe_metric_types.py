import json

from fireweave import EvaluationContext

from src.core.runtime_context import RuntimeContext
from src.features.telemetry.infrastructure.start_otel import Telemetry
from src.fireweave.fw_harness import fw_control_points

METRIC_ADOPTED = "feature.metric-types.adopted"
METRIC_ERROR = "feature.metric-types.error"
METRIC_COUNTER = "feature.metric-types.counter"
METRIC_GAUGE = "feature.metric-types.gauge"
METRIC_HISTOGRAM = "feature.metric-types.histogram"
METRIC_UPDOWN = "feature.metric-types.updown"
METRIC_EXP_HISTOGRAM = "feature.metric-types.exponential_histogram"


def handle_probe_metric_types(
    ctx: RuntimeContext, telemetry: Telemetry
) -> tuple[int, bytes]:
    """Flag-gated probe that emits every OTLP metric instrument type."""
    # @fireweave-flag metric-types-probe
    enabled = fw_control_points().get_boolean_value(
        "metric-types-probe",
        False,
        EvaluationContext(targeting_key=ctx.service),
    )
    if not enabled:
        telemetry.increment(METRIC_ERROR)
        return 404, (json.dumps({"error": "metric-types-probe disabled"}) + "\n").encode()

    try:
        telemetry.increment(METRIC_COUNTER)
        telemetry.set_gauge(METRIC_GAUGE, 42.0)
        telemetry.record(METRIC_HISTOGRAM, 12.5)
        telemetry.add_updown(METRIC_UPDOWN, 1)
        telemetry.emit_exponential_histogram(METRIC_EXP_HISTOGRAM, 8.0)
        telemetry.increment(METRIC_ADOPTED)
        payload = {
            "ok": True,
            "service": ctx.service,
            "environment": ctx.environment,
            "destination": ctx.destination,
            "metricTypes": [
                "counter",
                "gauge",
                "histogram",
                "updown_counter",
                "exponential_histogram",
            ],
            "metrics": [
                METRIC_COUNTER,
                METRIC_GAUGE,
                METRIC_HISTOGRAM,
                METRIC_UPDOWN,
                METRIC_EXP_HISTOGRAM,
                METRIC_ADOPTED,
            ],
        }
        return 200, (json.dumps(payload) + "\n").encode()
    except Exception as exc:  # noqa: BLE001
        telemetry.increment(METRIC_ERROR)
        return 500, (json.dumps({"error": str(exc)}) + "\n").encode()
