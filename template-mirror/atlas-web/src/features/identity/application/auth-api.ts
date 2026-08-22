import {
  reloadFireweaveFlags,
  syncFireweaveUser,
} from "../../../fireweave/fw-providers";
import type { AuthSession, BenchUser } from "../domain/session";

const KEY = "bench.sessionToken";

export async function fetchAuthConfig(apiBase: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/auth/config`);
    if (!res.ok) return false;
    const data = (await res.json()) as { enabled?: boolean };
    return Boolean(data.enabled);
  } catch {
    return false;
  }
}

export async function fetchUsers(apiBase: string): Promise<BenchUser[]> {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/auth/users?limit=50`);
  if (!res.ok) throw new Error(`users ${res.status}`);
  const data = (await res.json()) as { users?: BenchUser[] };
  return data.users ?? [];
}

export async function loginAs(
  apiBase: string,
  userId: string,
): Promise<AuthSession> {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`login ${res.status}`);
  const data = (await res.json()) as AuthSession;
  sessionStorage.setItem(KEY, data.sessionToken);
  await syncFireweaveUser(data.user.id, data.evaluationContext.properties);
  return data;
}

export function readStoredSession(): string | null {
  return sessionStorage.getItem(KEY);
}

export async function restoreSession(apiBase: string): Promise<AuthSession | null> {
  const token = readStoredSession();
  if (!token) return null;
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/auth/session`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    sessionStorage.removeItem(KEY);
    return null;
  }
  const data = (await res.json()) as Omit<AuthSession, "sessionToken">;
  const session = { sessionToken: token, ...data };
  await syncFireweaveUser(session.user.id, session.evaluationContext.properties);
  return session;
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
  void reloadFireweaveFlags("anonymous");
}
