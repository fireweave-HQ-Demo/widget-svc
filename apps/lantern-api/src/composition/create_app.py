from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from urllib.parse import urlparse

from src.core.runtime_context import RuntimeContext
from src.features.health.application.get_health import get_health
from src.features.home.application.get_home import home_body
from src.features.identity.presentation.http.handle_auth import (
    handle_auth_config,
    handle_auth_session,
    handle_auth_users,
)
from src.features.telemetry.infrastructure.start_otel import Telemetry
from src.features.usage_insights.presentation.http.handle_usage_summary import (
    handle_usage_summary,
)

CORS_METHODS = "GET, POST, PUT, DELETE, OPTIONS"
CORS_HEADERS = "content-type, authorization"


def serve(ctx: RuntimeContext, telemetry: Telemetry, port: int, html: bool, identity) -> None:
    class Handler(BaseHTTPRequestHandler):
        def _cors(self):
            self.send_header("access-control-allow-origin", "*")
            self.send_header("access-control-allow-methods", CORS_METHODS)
            self.send_header("access-control-allow-headers", CORS_HEADERS)

        def _respond(self, status: int, body: bytes, content_type: str = "application/json"):
            self.send_response(status)
            self.send_header("content-type", content_type)
            self._cors()
            self.end_headers()
            if body:
                self.wfile.write(body)

        def do_OPTIONS(self):
            self._respond(204, b"")

        def _route(self, method: str):
            telemetry.emit(f"{method} {self.path}")
            path = urlparse(self.path).path
            if path == "/health":
                body = json.dumps(get_health(ctx, telemetry.exporter_status)).encode()
                self._respond(200, body)
                return
            if path == "/auth/config" and method == "GET":
                status, body = handle_auth_config(identity)
                self._respond(status, body)
                return
            if path == "/auth/users" and method == "GET":
                status, body = handle_auth_users(identity, self.path)
                self._respond(status, body)
                return
            if path == "/auth/session" and method in ("GET", "POST", "DELETE"):
                length = int(self.headers.get("Content-Length", 0))
                raw = self.rfile.read(length) if length else b""
                status, body = handle_auth_session(identity, method, self.headers, raw)
                self._respond(status, body)
                return
            # @fireweave-controlpoint usage-insights
            if path == "/usage/summary" and method == "GET":
                status, body = handle_usage_summary(identity, telemetry, self.headers)
                self._respond(status, body)
                return
            if method == "GET" and (path == "/" or self.path.startswith("/?")):
                raw = home_body(ctx, html).encode()
                ctype = "text/html; charset=utf-8" if html else "text/plain"
                self._respond(200, raw, ctype)
                return
            self._respond(404, b"")

        def do_GET(self):
            self._route("GET")

        def do_POST(self):
            self._route("POST")

        def do_DELETE(self):
            self._route("DELETE")

        def log_message(self, *_args):
            return

    print(f"{ctx.service} listening on :{port} APP_ENV={ctx.environment}", flush=True)
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
