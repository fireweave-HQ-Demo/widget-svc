import json
import re
import time
from typing import Optional

from fireweave._sdk import EvaluationContext

from fireweave.fw_harness import fw_control_points
from src.features.identity.domain.user import BenchUser
from src.features.plan_notices.application.get_plan_notices import get_plan_notices


def _json(data: dict, status: int = 200) -> tuple[int, bytes]:
    return status, (json.dumps(data) + "\n").encode()


def _bearer(headers) -> Optional[str]:
    auth = headers.get("Authorization") or headers.get("authorization") or ""
    m = re.match(r"^Bearer\s+(.+)$", auth, re.I)
    return m.group(1).strip() if m else None


def handle_plan_notices(identity, telemetry, headers) -> tuple[int, bytes]:
    started = time.perf_counter()
    sess = identity.session(_bearer(headers))
    if not sess:
        return _json({"error": "unauthenticated"}, 401)

    user_row = sess["user"]
    user = BenchUser(**user_row)
    plan = user.plan

    # @fireweave-controlpoint plan-notices
    enabled = fw_control_points().get_boolean_value(
        "plan-notices",
        False,
        EvaluationContext(targeting_key=user.id),
    )
    if not enabled:
        return _json({"error": "not found"}, 404)

    try:
        body = get_plan_notices(user)
        elapsed_ms = (time.perf_counter() - started) * 1000
        telemetry.record(
            "plan.notices.latency_ms",
            elapsed_ms,
            attrs={"plan": plan},
        )
        return _json(body)
    except Exception:
        telemetry.increment(
            "plan.notices.request.server_error",
            attrs={"plan": plan},
        )
        return _json({"error": "notices unavailable"}, 500)
