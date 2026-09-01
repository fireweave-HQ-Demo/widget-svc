import json

from src.core.runtime_context import RuntimeContext
from src.features.telemetry.infrastructure.emit_metric_types import emit_all_metric_types
from src.features.telemetry.infrastructure.start_otel import Telemetry


def handle_probe_metric_types(ctx: RuntimeContext, telemetry: Telemetry) -> tuple[int, bytes]:
    # @fireweave-controlpoint metric-types-probe
    try:
        emitted = emit_all_metric_types(ctx)
        telemetry.increment("feature.metric-types.adopted")
        telemetry.record("feature.metric-types.histogram", 12.5)
        return 200, (
            json.dumps(
                {
                    "ok": True,
                    "feature": "metric-types-probe",
                    "emitted": emitted,
                    "types": [
                        "counter",
                        "updown",
                        "gauge",
                        "histogram",
                        "exponential_histogram",
                    ],
                }
            )
            + "\n"
        ).encode()
    except Exception as err:
        telemetry.increment("feature.metric-types.error")
        return 500, (json.dumps({"ok": False, "error": str(err)}) + "\n").encode()
