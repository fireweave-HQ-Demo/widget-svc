from src.features.identity.domain.user import BenchUser, user_index

LIMITS = {
    "free": {"requestsPerMonth": 1_000, "seats": 1},
    "pro": {"requestsPerMonth": 50_000, "seats": 10},
    "enterprise": {"requestsPerMonth": 500_000, "seats": 100},
}


def get_usage_summary(user: BenchUser) -> dict:
    idx = user_index(user.id)
    return {
        "period": "30d",
        "requests": 120 + idx * 17,
        "plan": user.plan,
        "limits": LIMITS[user.plan],
    }
