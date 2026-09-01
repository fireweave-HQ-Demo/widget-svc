from src.core.runtime_context import RuntimeContext

def to_health(ctx: RuntimeContext, status: str = "healthy") -> dict:
    return {
        "ok": True,
        "service": ctx.service,
        "environment": ctx.environment,
        "destination": ctx.destination,
        "exporter": {
            "endpoint": ctx.exporter_endpoint,
            "status": status,
            "signals": ["traces", "logs", "metrics"],
        },
    }
