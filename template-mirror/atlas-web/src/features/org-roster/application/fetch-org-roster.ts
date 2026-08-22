import { fw, metrics } from "@fireweaveai/deploy-sdk/flags/web";
import type { BenchUser } from "../../identity/domain/session";

export type OrgRosterTeammate = Pick<
  BenchUser,
  "id" | "name" | "email" | "plan" | "country"
>;

export type OrgRoster =
  | { ok: true; org: string; teammates: OrgRosterTeammate[] }
  | { ok: false; reason: "flag-off" | "http" };

function increment(name: string) {
  metrics.getMeter("atlas-web").createCounter(name).add(1);
}

export async function fetchOrgRoster(
  apiBase: string,
  token: string,
): Promise<OrgRoster> {
  try {
    // @fireweave-flag org-roster
    const enabled = fw.flag("org-roster", false);
    if (!enabled) return { ok: false, reason: "flag-off" };

    increment("feature.org-roster.adopted");
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/org/roster`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      increment("feature.org-roster.error");
      return { ok: false, reason: "http" };
    }
    const data = (await res.json()) as {
      org?: string;
      teammates?: OrgRosterTeammate[];
    };
    return {
      ok: true,
      org: data.org ?? "",
      teammates: data.teammates ?? [],
    };
  } catch {
    increment("feature.org-roster.error");
    return { ok: false, reason: "http" };
  }
}
