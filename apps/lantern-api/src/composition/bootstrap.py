"""Composition wiring for runtime + OTLP (used by main)."""
import os

from src.features.identity.infrastructure.json_identity_store import create_json_identity_store
from src.features.runtime.infrastructure.env_runtime import load_runtime, listen_port
from src.features.telemetry.infrastructure.start_otel import start_otel


def bootstrap(service: str, default_port: int):
    ctx = load_runtime(service)
    telemetry = start_otel(ctx)
    port = listen_port(default_port)
    identity = create_json_identity_store(
        enabled=os.environ.get("IDENTITY_ENABLED") == "true",
        seed_path=os.environ.get("IDENTITY_SEED_PATH", "/data/identity/seed.json"),
    )
    return ctx, telemetry, port, identity
