from __future__ import annotations

import json
import time
import uuid

from fireweave import EvaluationContext

from src.core.runtime_context import RuntimeContext
from src.features.home.application.pick_theme import pick_theme
from src.features.telemetry.infrastructure.start_otel import Telemetry
from src.fireweave.fw_harness import fw_control_points

_INSTANCE_KEY = f"inst_{uuid.uuid4().hex}"


def handle_theme(
    ctx: RuntimeContext,
    telemetry: Telemetry,
    targeting_key: str | None,
) -> tuple[int, bytes]:
    started = time.perf_counter()
    key = targeting_key or _INSTANCE_KEY
    # @fireweave-controlpoint random-theme
    enabled = fw_control_points().get_boolean_value(
        "random-theme",
        False,
        EvaluationContext(targeting_key=key),
    )
    if not enabled:
        return 404, json.dumps({"error": "theme off", "service": ctx.service}).encode()
    theme = pick_theme()
    telemetry.increment("random-theme.served")
    telemetry.record("random-theme.latency_ms", (time.perf_counter() - started) * 1000)
    return 200, json.dumps({"service": ctx.service, "theme": theme}).encode()
