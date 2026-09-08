import { useEffect, useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession, BenchUser } from "../domain/session";
import {
  fetchUsers,
  loginAs,
  restoreSession,
} from "../application/auth-api";
import { syncFireweaveUser } from "../../../fireweave/fw-providers";

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
                  void syncFireweaveUser(session.user.id, session.evaluationContext);
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
      .then(setSession)
      .catch(() => setSession(null));
  }, [ctx.apiBase, ctx.identityEnabled]);

  return { session, setSession, loading: session === undefined };
}
