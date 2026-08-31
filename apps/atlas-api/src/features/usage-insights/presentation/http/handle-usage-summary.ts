import type { RuntimeContext } from "../../../../core/runtime-context";
import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import type { IdentityStore } from "../../../identity/application/ports/identity-store";
import { fw } from "../../../../../fireweave/fw-harness";
import { getUsageSummary } from "../../application/get-usage-summary";

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

export async function handleUsageSummary(
  ctx: RuntimeContext,
  telemetry: Telemetry,
  identity: IdentityStore,
  req: Request,
): Promise<Response> {
  const started = performance.now();
  const sess = identity.session(bearer(req));
  if (!sess) {
    telemetry.increment("usage.summary.request", {
      outcome: "error",
      http_status: "401",
      plan: "unknown",
    });
    return json({ error: "unauthenticated" }, 401);
  }

  // @fireweave-controlpoint usage-insights
  const enabled = await fw.controlPoints.getBooleanValue("usage-insights", false, {
    targetingKey: sess.user.id,
  });
  if (!enabled) {
    telemetry.increment("usage.summary.request", {
      outcome: "error",
      http_status: "404",
      plan: sess.user.plan,
    });
    return json({ error: "not found" }, 404);
  }

  try {
    const summary = getUsageSummary(sess.user);
    const elapsed = performance.now() - started;
    telemetry.increment("usage.summary.request", {
      outcome: "success",
      http_status: "200",
      plan: sess.user.plan,
    });
    telemetry.record("usage.summary.latency_ms", elapsed, {
      plan: sess.user.plan,
    });
    return json(summary);
  } catch {
    telemetry.increment("usage.summary.request", {
      outcome: "error",
      http_status: "500",
      plan: sess.user.plan,
    });
    return json({ error: "snapshot unavailable" }, 500);
  }
}
