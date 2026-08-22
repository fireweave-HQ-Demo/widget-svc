import type { IdentityStore } from "../../../identity/application/ports/identity-store";
import { getOrgRoster } from "../../application/get-org-roster";

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

export async function handleOrgRoster(
  store: IdentityStore,
  req: Request,
): Promise<Response> {
  const result = await getOrgRoster(store, bearer(req));
  if (!result.ok) {
    if (result.reason === "no-session") return json({ error: "no session" }, 401);
    if (result.reason === "identity-disabled") {
      return json({ error: "identity disabled" }, 404);
    }
    return json({ error: "not found" }, 404);
  }
  return json({ org: result.org, teammates: result.teammates });
}
