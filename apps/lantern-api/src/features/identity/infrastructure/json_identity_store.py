import json
import secrets
from dataclasses import asdict
from pathlib import Path
from typing import Optional

from src.features.identity.domain.user import BenchUser, to_evaluation_context


def create_json_identity_store(*, enabled: bool, seed_path: str):
    users = _load_users(seed_path) if enabled else []
    by_id = {u.id: u for u in users}
    sessions: dict[str, str] = {}
    store_enabled = enabled

    class Store:
        enabled = store_enabled

        def list_users(self, limit: int) -> list[dict]:
            return [asdict(u) for u in users[: max(1, limit)]]

        def login(self, user_id: str):
            user = by_id.get(user_id)
            if not user:
                return None
            token = secrets.token_hex(16)
            sessions[token] = user.id
            return {
                "token": token,
                "user": asdict(user),
                "evaluationContext": to_evaluation_context(user),
            }

        def session(self, token: Optional[str]):
            if not token:
                return None
            user_id = sessions.get(token)
            if not user_id:
                return None
            user = by_id.get(user_id)
            if not user:
                return None
            return {
                "user": asdict(user),
                "evaluationContext": to_evaluation_context(user),
            }

    return Store()


def _load_users(seed_path: str) -> list[BenchUser]:
    try:
        raw = json.loads(Path(seed_path).read_text(encoding="utf-8"))
        rows = raw.get("users") if isinstance(raw, dict) else None
        if not isinstance(rows, list):
            return []
        out: list[BenchUser] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            out.append(
                BenchUser(
                    id=str(row.get("id", "")),
                    email=str(row.get("email", "")),
                    name=str(row.get("name", "")),
                    org=str(row.get("org", "")),
                    plan=row.get("plan", "free"),
                    country=str(row.get("country", "")),
                )
            )
        return out
    except (OSError, json.JSONDecodeError):
        return []
