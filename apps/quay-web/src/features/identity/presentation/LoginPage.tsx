import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession, BenchUser } from "../domain/session";
import {
  fetchUsers,
  loginAs,
  restoreSession,
} from "../application/auth-api";

export function LoginPage(props: {
  ctx: RuntimeContext;
  onLoggedIn: (session: AuthSession) => void;
}) {
  const [users, setUsers] = createSignal<BenchUser[]>([]);
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  onMount(() => {
    void fetchUsers(props.ctx.apiBase)
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  });

  async function pickUser(userId: string) {
    setBusy(true);
    setError("");
    try {
      const session = await loginAs(props.ctx.apiBase, userId);
      props.onLoggedIn(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main class="shell">
      <div class="brand">
        <strong>fireweave</strong>
        <span>fixture · sign in</span>
      </div>
      <h1>Choose a user</h1>
      <p class="lede">
        Dummy bench users from the identity seed — pick one to complete login.
      </p>
      <Show when={error()}>
        <pre class="probe bad">{error()}</pre>
      </Show>
      <ul class="user-list">
        <For each={users()}>
          {(u) => (
            <li>
              <button type="button" disabled={busy()} onClick={() => void pickUser(u.id)}>
                <strong>{u.name}</strong>
                <span>{u.email}</span>
                <em>
                  {u.org} · {u.plan} · {u.country}
                </em>
              </button>
            </li>
          )}
        </For>
      </ul>
    </main>
  );
}

export function useAuthGate(ctx: RuntimeContext) {
  const [session, setSession] = createSignal<AuthSession | null | undefined>(
    undefined,
  );

  createEffect(() => {
    if (!ctx.identityEnabled) {
      setSession(null);
      return;
    }
    void restoreSession(ctx.apiBase)
      .then(setSession)
      .catch(() => setSession(null));
  });

  return {
    session,
    setSession,
    loading: () => session() === undefined,
  };
}
