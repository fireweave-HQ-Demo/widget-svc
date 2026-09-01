import time
from src.features.telemetry.infrastructure.start_otel import Telemetry

PREFIX = "metric.showcase"


def emit_all_metric_types(telemetry: Telemetry) -> dict[str, str]:
    started = time.perf_counter()
    telemetry.up_down(f"{PREFIX}.inflight", 1)
    try:
        telemetry.increment(f"{PREFIX}.requests")
        latency_ms = (time.perf_counter() - started) * 1000.0
        telemetry.record(f"{PREFIX}.latency_ms", latency_ms)
        telemetry.set_gauge(f"{PREFIX}.queue_depth", float(int(latency_ms) % 10 + 1))
        return {
            "counter": f"{PREFIX}.requests",
            "histogram": f"{PREFIX}.latency_ms",
            "upDown": f"{PREFIX}.inflight",
            "gauge": f"{PREFIX}.queue_depth",
        }
    finally:
        telemetry.up_down(f"{PREFIX}.inflight", -1)
