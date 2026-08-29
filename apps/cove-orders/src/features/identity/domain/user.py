from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Literal


@dataclass(frozen=True)
class BenchUser:
    id: str
    email: str
    name: str
    org: str
    plan: Literal["free", "pro", "enterprise"]
    country: str


def user_index(user_id: str) -> int:
    raw = user_id.removeprefix("user_")
    try:
        return int(raw)
    except ValueError:
        return 0


def to_evaluation_context(user: BenchUser) -> dict:
    idx = user_index(user.id)
    base = datetime(2020, 1, 1, tzinfo=timezone.utc)
    signup = base + timedelta(days=idx)
    return {
        "distinctId": user.id,
        "properties": {
            "email": user.email,
            "name": user.name,
            "org": user.org,
            "plan": user.plan,
            "country": user.country,
            "signupDate": signup.strftime("%Y-%m-%d"),
            "beta": idx % 3 == 0,
        },
    }
