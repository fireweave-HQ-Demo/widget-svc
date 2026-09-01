import json
import time
import urllib.request
import uuid
from src.core.runtime_context import RuntimeContext

class Telemetry:
    def __init__(self, ctx: RuntimeContext):
        self.ctx = ctx
        self.exporter_status = "healthy"
        self.base = ctx.exporter_endpoint.rstrip("/")

    def emit(self, name: str) -> None:
        now = time.time_ns()
        trace_id = uuid.uuid4().hex
        span_id = uuid.uuid4().hex[:16]
        traces = {
            "resourceSpans": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": self.ctx.service}}]},
                "scopeSpans": [{"spans": [{
                    "traceId": trace_id, "spanId": span_id, "name": name, "kind": 1,
                    "startTimeUnixNano": str(now), "endTimeUnixNano": str(now + 1_000_000),
                    "status": {"code": 1},
                }]}],
            }]
        }
        logs = {
            "resourceLogs": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": self.ctx.service}}]},
                "scopeLogs": [{"logRecords": [{
                    "timeUnixNano": str(now), "severityNumber": 9,
                    "body": {"stringValue": "request"},
                }]}],
            }]
        }
        try:
            self._post("/v1/traces", traces)
            self._post("/v1/logs", logs)
        except Exception:
            self.exporter_status = "degraded"

    def increment(self, name: str, value: int = 1) -> None:
        now = str(time.time_ns())
        payload = {
            "resourceMetrics": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": self.ctx.service}}]},
                "scopeMetrics": [{"metrics": [{
                    "name": name,
                    "sum": {
                        "aggregationTemporality": 2,
                        "isMonotonic": True,
                        "dataPoints": [{
                            "asInt": str(value),
                            "startTimeUnixNano": now,
                            "timeUnixNano": now,
                        }],
                    },
                }]}],
            }]
        }
        try:
            self._post("/v1/metrics", payload)
        except Exception:
            self.exporter_status = "degraded"

    def record(self, name: str, value: float) -> None:
        now = str(time.time_ns())
        payload = {
            "resourceMetrics": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": self.ctx.service}}]},
                "scopeMetrics": [{"metrics": [{
                    "name": name,
                    "histogram": {
                        "aggregationTemporality": 2,
                        "dataPoints": [{
                            "count": "1",
                            "sum": value,
                            "timeUnixNano": now,
                        }],
                    },
                }]}],
            }]
        }
        try:
            self._post("/v1/metrics", payload)
        except Exception:
            self.exporter_status = "degraded"

    def set_gauge(self, name: str, value: float) -> None:
        now = str(time.time_ns())
        payload = {
            "resourceMetrics": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": self.ctx.service}}]},
                "scopeMetrics": [{"metrics": [{
                    "name": name,
                    "gauge": {
                        "dataPoints": [{
                            "asDouble": value,
                            "startTimeUnixNano": now,
                            "timeUnixNano": now,
                        }],
                    },
                }]}],
            }]
        }
        try:
            self._post("/v1/metrics", payload)
        except Exception:
            self.exporter_status = "degraded"

    def add_updown(self, name: str, delta: int = 1) -> None:
        now = str(time.time_ns())
        payload = {
            "resourceMetrics": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": self.ctx.service}}]},
                "scopeMetrics": [{"metrics": [{
                    "name": name,
                    "sum": {
                        "aggregationTemporality": 2,
                        "isMonotonic": False,
                        "dataPoints": [{
                            "asInt": str(delta),
                            "startTimeUnixNano": now,
                            "timeUnixNano": now,
                        }],
                    },
                }]}],
            }]
        }
        try:
            self._post("/v1/metrics", payload)
        except Exception:
            self.exporter_status = "degraded"

    def emit_exponential_histogram(self, name: str, value: float) -> None:
        now = str(time.time_ns())
        payload = {
            "resourceMetrics": [{
                "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": self.ctx.service}}]},
                "scopeMetrics": [{"metrics": [{
                    "name": name,
                    "exponentialHistogram": {
                        "aggregationTemporality": 2,
                        "dataPoints": [{
                            "count": "1",
                            "sum": value,
                            "scale": 0,
                            "zeroCount": "0",
                            "positive": {"offset": 0, "bucketCounts": ["1"]},
                            "negative": {"offset": 0, "bucketCounts": []},
                            "startTimeUnixNano": now,
                            "timeUnixNano": now,
                        }],
                    },
                }]}],
            }]
        }
        try:
            self._post("/v1/metrics", payload)
        except Exception:
            self.exporter_status = "degraded"

    def _post(self, path: str, payload: dict) -> None:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            self.base + path, data=data,
            headers={"content-type": "application/json"}, method="POST",
        )
        urllib.request.urlopen(req, timeout=2).read()

def start_otel(ctx: RuntimeContext) -> Telemetry:
    return Telemetry(ctx)
