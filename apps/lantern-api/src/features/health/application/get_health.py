from src.core.runtime_context import RuntimeContext
from src.features.health.domain.health_report import to_health

def get_health(ctx: RuntimeContext, status: str = "healthy") -> dict:
    return to_health(ctx, status)
