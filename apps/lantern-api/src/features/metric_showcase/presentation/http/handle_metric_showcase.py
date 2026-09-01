import json

from src.features.metric_showcase.application.emit_all_metric_types import (
    emit_all_metric_types,
)
from src.features.telemetry.infrastructure.start_otel import Telemetry
from src.fireweave.fw_harness import fw_control_points
from src.fireweave.fw_providers import resolve_fw_env_name
import os
from fireweave import EvaluationContext


def handle_metric_showcase(telemetry: Telemetry) -> tuple[int, bytes]:
    # @fireweave-controlpoint metric-showcase
    enabled = fw_control_points().get_boolean_value(
        "metric-showcase",
        False,
        EvaluationContext(targeting_key="bench-instance"),
    )
    if not enabled:
        return 404, (json.dumps({"error": "metric-showcase disabled"}) + "\n").encode()
    emitted = emit_all_metric_types(telemetry)
    body = {
        "ok": True,
        "feature": "metric-showcase",
        "emitted": emitted,
        "kinds": ["counter", "histogram", "up_down_counter", "gauge"],
        "environment": resolve_fw_env_name(os.environ),
    }
    return 200, (json.dumps(body) + "\n").encode()
