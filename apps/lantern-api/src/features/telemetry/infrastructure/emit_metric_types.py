import json
import time
import urllib.request

from src.core.runtime_context import RuntimeContext


def _post_metrics(base: str, payload: dict) -> None:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        base + "/v1/metrics",
        data=data,
        headers={"content-type": "application/json"},
        method="POST",
    )
    urllib.request.urlopen(req, timeout=2).read()


def emit_all_metric_types(ctx: RuntimeContext) -> list[str]:
    """Emit counter, updown, gauge, histogram, and exponential histogram via OTLP JSON."""
    base = ctx.exporter_endpoint.rstrip("/")
    now = str(time.time_ns())
    resource = {
        "attributes": [
            {"key": "service.name", "value": {"stringValue": ctx.service}},
        ]
    }
    metrics = [
        {
            "name": "feature.metric-types.counter",
            "sum": {
                "aggregationTemporality": 2,
                "isMonotonic": True,
                "dataPoints": [{"asInt": "1", "startTimeUnixNano": now, "timeUnixNano": now}],
            },
        },
        {
            "name": "feature.metric-types.updown",
            "sum": {
                "aggregationTemporality": 2,
                "isMonotonic": False,
                "dataPoints": [{"asInt": "1", "startTimeUnixNano": now, "timeUnixNano": now}],
            },
        },
        {
            "name": "feature.metric-types.gauge",
            "gauge": {"dataPoints": [{"asDouble": 42.0, "timeUnixNano": now}]},
        },
        {
            "name": "feature.metric-types.histogram",
            "histogram": {
                "aggregationTemporality": 2,
                "dataPoints": [
                    {
                        "count": "1",
                        "sum": 12.5,
                        "timeUnixNano": now,
                        "bucketCounts": ["0", "0", "1", "0"],
                        "explicitBounds": [0, 10, 100],
                    }
                ],
            },
        },
        {
            "name": "feature.metric-types.exponential_histogram",
            "exponentialHistogram": {
                "aggregationTemporality": 2,
                "dataPoints": [
                    {
                        "count": "1",
                        "sum": 12.5,
                        "scale": 3,
                        "zeroCount": "0",
                        "positive": {"offset": 0, "bucketCounts": ["1"]},
                        "negative": {"offset": 0, "bucketCounts": []},
                        "timeUnixNano": now,
                    }
                ],
            },
        },
        {
            "name": "feature.metric-types.adopted",
            "sum": {
                "aggregationTemporality": 2,
                "isMonotonic": True,
                "dataPoints": [{"asInt": "1", "startTimeUnixNano": now, "timeUnixNano": now}],
            },
        },
    ]
    _post_metrics(
        base,
        {"resourceMetrics": [{"resource": resource, "scopeMetrics": [{"metrics": metrics}]}]},
    )
    return [m["name"] for m in metrics]
