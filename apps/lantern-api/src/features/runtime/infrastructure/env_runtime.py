import os
from src.core.runtime_context import RuntimeContext

def load_runtime(service: str) -> RuntimeContext:
    return RuntimeContext(
        service=service,
        environment=os.environ.get("APP_ENV", "dev"),
        destination=os.environ.get("BENCH_DESTINATION", "control"),
        exporter_endpoint=os.environ.get(
            "OTEL_EXPORTER_OTLP_ENDPOINT", "http://collector:4318"
        ),
    )

def listen_port(fallback: int) -> int:
    return int(os.environ.get("PORT", fallback))
