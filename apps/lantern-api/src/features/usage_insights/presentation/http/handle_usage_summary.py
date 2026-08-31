import json
import re
import time
from typing import Optional

from fireweave._sdk import EvaluationContext

from fireweave.fw_harness import fw_control_points
from src.features.identity.domain.user import BenchUser
from src.features.usage_insights.application.get_usage_summary import get_usage_summary


def _json(data: dict, status: int = 200) -> tuple[int, bytes]:
    return status, (json.dumps(data) + "\n").encode()


def _bearer(headers) -> Optional[str]:
    auth = headers.get("Authorization") or headers.get("authorization") or ""
    m = re.match(r"^Bearer\s+(.+)$", auth, re.I)
    return m.group(1).strip() if m else None


def handle_usage_summary(identity, telemetry, headers) -> tuple[int, bytes]:
    started = time.perf_counter()
    sess = identity.session(_bearer(headers))
    if not sess:
        telemetry.increment(
            "usage.summary.request",
            attrs={"outcome": "error", "http_status": "401", "plan": "unknown"},
        )
        return _json({"error": "unauthenticated"}, 401)

    user_row = sess["user"]
    user = BenchUser(**user_row)
    plan = user.plan

    # @fireweave-controlpoint usage-insights
    enabled = fw_control_points().get_boolean_value(
        "usage-insights",
        False,
        EvaluationContext(targeting_key=user.id),
    )
    if not enabled:
        telemetry.increment(
            "usage.summary.request",
            attrs={"outcome": "error", "http_status": "404", "plan": plan},
        )
        return _json({"error": "not found"}, 404)

    try:
        summary = get_usage_summary(user)
        elapsed_ms = (time.perf_counter() - started) * 1000
        telemetry.increment(
            "usage.summary.request",
            attrs={"outcome": "success", "http_status": "200", "plan": plan},
        )
        telemetry.record(
            "usage.summary.latency_ms",
            elapsed_ms,
            attrs={"plan": plan},
        )
        return _json(summary)
    except Exception:
        telemetry.increment(
            "usage.summary.request",
            attrs={"outcome": "error", "http_status": "500", "plan": plan},
        )
        return _json({"error": "snapshot unavailable"}, 500)
