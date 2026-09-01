import json
import re
from typing import Optional
from urllib.parse import parse_qs, urlparse

from src.fireweave.fw_providers import register_fw_target


def _json(data: dict, status: int = 200) -> tuple[int, bytes]:
    return status, (json.dumps(data) + "\n").encode()


def _bearer(headers) -> Optional[str]:
    auth = headers.get("Authorization") or headers.get("authorization") or ""
    m = re.match(r"^Bearer\s+(.+)$", auth, re.I)
    return m.group(1).strip() if m else None


def handle_auth_config(store) -> tuple[int, bytes]:
    return _json({"enabled": store.enabled})


def handle_auth_users(store, path: str) -> tuple[int, bytes]:
    if not store.enabled:
        return _json({"error": "identity disabled"}, 404)
    qs = parse_qs(urlparse(path).query)
    limit_raw = (qs.get("limit") or ["50"])[0]
    try:
        limit = int(limit_raw)
    except ValueError:
        limit = 50
    return _json({"users": store.list_users(limit)})


def handle_auth_session(store, method: str, headers, body: bytes) -> tuple[int, bytes]:
    if not store.enabled:
        return _json({"error": "identity disabled"}, 404)
    if method == "GET":
        sess = store.session(_bearer(headers))
        if not sess:
            return _json({"error": "no session"}, 401)
        return _json(sess)
    if method == "POST":
        try:
            payload = json.loads(body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return _json({"error": "invalid json"}, 400)
        user_id = str(payload.get("userId", "")).strip()
        if not user_id:
            return _json({"error": "userId required"}, 400)
        logged = store.login(user_id)
        if not logged:
            return _json({"error": "unknown user"}, 404)
        register_fw_target(
            logged["user"]["id"],
            properties=logged["evaluationContext"]["properties"],
        )
        return _json(
            {
                "sessionToken": logged["token"],
                "user": logged["user"],
                "evaluationContext": logged["evaluationContext"],
            }
        )
    if method == "DELETE":
        return _json({"ok": True})
    return _json({"error": "method not allowed"}, 405)
