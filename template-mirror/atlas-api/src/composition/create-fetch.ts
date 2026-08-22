import type { RuntimeContext } from "../core/runtime-context";
import type { Telemetry } from "../features/telemetry/application/ports/telemetry";
import { handleHealth } from "../features/health/presentation/http/handle-health";
import { handleHome } from "../features/home/presentation/http/handle-home";

const CORS: HeadersInit = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
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
): (req: Request) => Response | Promise<Response> {
  return async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    const res = await telemetry.withRequestSpan(req, async () => {
      const path = new URL(req.url).pathname;
      if (path === "/health") return handleHealth(ctx, telemetry);
      if (path === "/") return handleHome(ctx);
      return new Response("not found\n", { status: 404 });
    });
    return withCors(res);
  };
}
