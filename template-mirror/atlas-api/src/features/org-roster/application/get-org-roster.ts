import { fw, metrics } from "@fireweaveai/deploy-sdk/flags";
import type { BenchUser } from "../../identity/domain/user";
import type { IdentityStore } from "../../identity/application/ports/identity-store";

export type OrgRoster =
  | {
      ok: true;
      org: string;
      teammates: Pick<BenchUser, "id" | "name" | "email" | "plan" | "country">[];
    }
  | { ok: false; reason: "flag-off" | "no-session" | "identity-disabled" };

function increment(name: string) {
  metrics.getMeter("atlas-api").createCounter(name).add(1);
}

export async function getOrgRoster(
  store: IdentityStore,
  token: string | undefined,
): Promise<OrgRoster> {
  const sess = store.session(token);
  const targetingKey = sess?.user.id ?? "anonymous";
  try {
    // @fireweave-flag org-roster
    const enabled = await fw.flag("org-roster", false, {
      targetingKey,
    });
    if (!enabled) return { ok: false, reason: "flag-off" };
    if (!store.enabled) return { ok: false, reason: "identity-disabled" };
    if (!sess) return { ok: false, reason: "no-session" };

    increment("feature.org-roster.adopted");
    const teammates = store
      .listByOrg(sess.user.org, 24)
      .filter((u) => u.id !== sess.user.id)
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.plan,
        country: u.country,
      }));
    return { ok: true, org: sess.user.org, teammates };
  } catch {
    increment("feature.org-roster.error");
    return { ok: false, reason: "flag-off" };
  }
}
