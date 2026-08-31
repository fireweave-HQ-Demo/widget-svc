import type { RuntimeContext } from "../../../../core/runtime-context";
import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import type { IdentityStore } from "../../../identity/application/ports/identity-store";
import { fw } from "../../../../../fireweave/fw-harness";
import { getActivityFeed } from "../../application/get-activity-feed";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data) + "\n", {
    status,
    headers: { "content-type": "application/json" },
  });
}

function bearer(req: Request): string | undefined {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m?.[1]?.trim();
}

export async function handleActivityFeed(
  ctx: RuntimeContext,
  telemetry: Telemetry,
  identity: IdentityStore,
  req: Request,
): Promise<Response> {
  const started = performance.now();
  const sess = identity.session(bearer(req));
  if (!sess) {
    return json({ error: "unauthenticated" }, 401);
  }

  // @fireweave-controlpoint activity-feed
  const enabled = await fw.controlPoints.getBooleanValue("activity-feed", false, {
    targetingKey: sess.user.id,
  });
  if (!enabled) {
    return json({ error: "not found" }, 404);
  }

  try {
    const body = getActivityFeed(sess.user);
    const elapsed = performance.now() - started;
    telemetry.record("activity.feed.latency_ms", elapsed, {
      plan: sess.user.plan,
    });
    return json(body);
  } catch {
    telemetry.increment("activity.feed.request.server_error", {
      plan: sess.user.plan,
    });
    return json({ error: "activity unavailable" }, 500);
  }
}
