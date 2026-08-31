import type { RuntimeContext } from "../../../../core/runtime-context";
import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import type { IdentityStore } from "../../../identity/application/ports/identity-store";
import { fw } from "../../../../../fireweave/fw-harness";
import { getPlanNotices } from "../../application/get-plan-notices";

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

export async function handlePlanNotices(
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

  // @fireweave-controlpoint plan-notices
  const enabled = await fw.controlPoints.getBooleanValue("plan-notices", false, {
    targetingKey: sess.user.id,
  });
  if (!enabled) {
    return json({ error: "not found" }, 404);
  }

  try {
    const body = getPlanNotices(sess.user);
    const elapsed = performance.now() - started;
    telemetry.record("plan.notices.latency_ms", elapsed, {
      plan: sess.user.plan,
    });
    return json(body);
  } catch {
    telemetry.increment("plan.notices.request.server_error", {
      plan: sess.user.plan,
    });
    return json({ error: "notices unavailable" }, 500);
  }
}
