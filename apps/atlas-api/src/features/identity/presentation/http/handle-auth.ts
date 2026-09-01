import type { IdentityStore } from "../../application/ports/identity-store";
import { registerFwTarget } from "../../../../fireweave/fw-providers";

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

export function handleAuthConfig(store: IdentityStore): Response {
  return json({ enabled: store.enabled });
}

export function handleAuthUsers(store: IdentityStore, req: Request): Response {
  if (!store.enabled) return json({ error: "identity disabled" }, 404);
  const url = new URL(req.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  return json({ users: store.listUsers(limit) });
}

export async function handleAuthSession(
  store: IdentityStore,
  req: Request,
): Promise<Response> {
  if (!store.enabled) return json({ error: "identity disabled" }, 404);
  if (req.method === "GET") {
    const sess = store.session(bearer(req));
    if (!sess) return json({ error: "no session" }, 401);
    return json(sess);
  }
  if (req.method === "POST") {
    let body: { userId?: string };
    try {
      body = (await req.json()) as { userId?: string };
    } catch {
      return json({ error: "invalid json" }, 400);
    }
    const userId = body.userId?.trim();
    if (!userId) return json({ error: "userId required" }, 400);
    const logged = store.login(userId);
    if (!logged) return json({ error: "unknown user" }, 404);
    // Cohort identity — always-on, never flag-gated (INIT-S8).
    void registerFwTarget(userId, {
      properties: {
        email: logged.user.email,
        name: logged.user.name,
        org: logged.user.org,
        plan: logged.user.plan,
        country: logged.user.country,
      },
    });
    return json({
      sessionToken: logged.token,
      user: logged.user,
      evaluationContext: logged.evaluationContext,
    });
  }
  if (req.method === "DELETE") {
    return json({ ok: true });
  }
  return json({ error: "method not allowed" }, 405);
}
