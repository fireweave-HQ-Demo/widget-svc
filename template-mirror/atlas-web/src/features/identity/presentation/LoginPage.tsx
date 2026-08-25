import { useEffect, useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession, BenchUser } from "../domain/session";
import {
  fetchUsers,
  loginAs,
  restoreSession,
} from "../application/auth-api";
import {
  resetFireweaveUser,
  syncFireweaveUser,
} from "../../../fireweave/fw-providers";

async function bindFwUser(session: AuthSession): Promise<void> {
  // Cohort identity — always-on (INIT-S8); never behind a flag.
  const p = session.evaluationContext.properties;
  await syncFireweaveUser(session.user.id, {
    plan: p.plan,
    beta: p.beta,
    org: p.org,
    country: p.country,
  });
}

export function LoginPage({
  ctx,
  onLoggedIn,
}: {
  ctx: RuntimeContext;
  onLoggedIn: (session: AuthSession) => void;
}) {
  const [users, setUsers] = useState<BenchUser[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchUsers(ctx.apiBase)
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [ctx.apiBase]);

  return (
    <main className="shell">
      <div className="brand">
        <strong>fireweave</strong>
        <span>fixture · sign in</span>
      </div>
      <h1>Choose a user</h1>
      <p className="lede">
        Dummy bench users from the identity seed — pick one to complete login.
      </p>
      {error ? <pre className="probe bad">{error}</pre> : null}
      <ul className="user-list">
        {users.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const session = await loginAs(ctx.apiBase, u.id);
                  await bindFwUser(session);
                  onLoggedIn(session);
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <strong>{u.name}</strong>
              <span>{u.email}</span>
              <em>
                {u.org} · {u.plan} · {u.country}
              </em>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function useAuthGate(ctx: RuntimeContext) {
  const [session, setSession] = useState<AuthSession | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!ctx.identityEnabled) {
      setSession(null);
      return;
    }
    void restoreSession(ctx.apiBase)
      .then(async (s) => {
        if (s) await bindFwUser(s);
        else await resetFireweaveUser();
        setSession(s);
      })
      .catch(async () => {
        await resetFireweaveUser();
        setSession(null);
      });
  }, [ctx.apiBase, ctx.identityEnabled]);

  return { session, setSession, loading: session === undefined };
}
