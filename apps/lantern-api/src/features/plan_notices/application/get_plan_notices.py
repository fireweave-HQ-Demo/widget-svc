from src.features.identity.domain.user import BenchUser, user_index

LIMITS = {
    "free": 1_000,
    "pro": 50_000,
    "enterprise": 500_000,
}


def get_plan_notices(user: BenchUser) -> dict:
    idx = user_index(user.id)
    requests = 120 + idx * 17
    limit = LIMITS[user.plan]
    pct = round((requests / limit) * 100)
    notices: list[dict] = []

    if pct >= 80:
        notices.append(
            {
                "id": "limit-warning",
                "severity": "warn",
                "message": (
                    f"You've used {pct}% of your monthly request limit "
                    f"({requests:,} / {limit:,})."
                ),
            }
        )

    if user.plan == "free":
        notices.append(
            {
                "id": "upgrade-hint",
                "severity": "info",
                "message": "Upgrade to Pro for higher limits and priority support.",
            }
        )

    if not notices:
        notices.append(
            {
                "id": "all-clear",
                "severity": "info",
                "message": "Your plan is in good standing this month.",
            }
        )

    return {"notices": notices, "plan": user.plan}
