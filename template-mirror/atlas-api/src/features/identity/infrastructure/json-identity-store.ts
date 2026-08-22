import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import type { BenchUser } from "../domain/user";
import { toEvaluationContext } from "../domain/user";
import type { IdentityStore } from "../application/ports/identity-store";

type SeedFile = { users?: BenchUser[] };

export function createJsonIdentityStore(input: {
  enabled: boolean;
  seedPath: string;
}): IdentityStore {
  const users = input.enabled ? loadUsers(input.seedPath) : [];
  const byId = new Map(users.map((u) => [u.id, u]));
  const sessions = new Map<string, string>();

  return {
    enabled: input.enabled,
    listUsers(limit) {
      return users.slice(0, Math.max(1, limit));
    },
    listByOrg(org, limit) {
      return users
        .filter((u) => u.org === org)
        .slice(0, Math.max(1, limit));
    },
    login(userId) {
      const user = byId.get(userId);
      if (!user) return null;
      const token = randomBytes(16).toString("hex");
      sessions.set(token, user.id);
      return { token, user, evaluationContext: toEvaluationContext(user) };
    },
    session(token) {
      if (!token) return null;
      const userId = sessions.get(token);
      if (!userId) return null;
      const user = byId.get(userId);
      if (!user) return null;
      return { user, evaluationContext: toEvaluationContext(user) };
    },
  };
}

function loadUsers(seedPath: string): BenchUser[] {
  try {
    const raw = JSON.parse(readFileSync(seedPath, "utf8")) as SeedFile;
    return Array.isArray(raw.users) ? raw.users : [];
  } catch {
    return [];
  }
}
