import type { RuntimeContext } from "../core/runtime-context";
import type { Telemetry } from "../features/telemetry/application/ports/telemetry";
import type { IdentityStore } from "../features/identity/application/ports/identity-store";
import { handleHealth } from "../features/health/presentation/http/handle-health";
import { handleHome } from "../features/home/presentation/http/handle-home";
import {
  handleAuthConfig,
  handleAuthSession,
  handleAuthUsers,
} from "../features/identity/presentation/http/handle-auth";

const CORS: HeadersInit = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export function createFetch(
  ctx: RuntimeContext,
  telemetry: Telemetry,
  identity: IdentityStore,
): (req: Request) => Response | Promise<Response> {
  return async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    const res = await telemetry.withRequestSpan(req, async () => {
      const path = new URL(req.url).pathname;
      if (path === "/health") return handleHealth(ctx, telemetry);
      if (path === "/") return handleHome(ctx);
      if (path === "/auth/config") return handleAuthConfig(identity);
      if (path === "/auth/users" && req.method === "GET") {
        return handleAuthUsers(identity, req);
      }
      if (path === "/auth/session") {
        return handleAuthSession(identity, req);
      }
      return new Response("not found\n", { status: 404 });
    });
    return withCors(res);
  };
}
