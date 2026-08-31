from src.features.identity.domain.user import BenchUser, user_index


def get_activity_feed(user: BenchUser) -> dict:
    idx = user_index(user.id)

    def day(offset: int) -> str:
        # Deterministic dates in Aug 2026 based on user index.
        d = 20 + (idx % 7) - offset
        return f"2026-08-{d:02d}"

    billing = (
        "Free plan still active"
        if user.plan == "free"
        else f"{user.plan} plan invoice generated"
    )
    return {
        "plan": user.plan,
        "items": [
            {
                "id": f"act_{idx}_login",
                "kind": "login",
                "summary": f"{user.name} signed in from {user.country}",
                "at": day(0),
            },
            {
                "id": f"act_{idx}_api",
                "kind": "api",
                "summary": f"API usage spike: {120 + idx * 17} requests",
                "at": day(1),
            },
            {
                "id": f"act_{idx}_billing",
                "kind": "billing",
                "summary": billing,
                "at": day(3),
            },
        ],
    }
