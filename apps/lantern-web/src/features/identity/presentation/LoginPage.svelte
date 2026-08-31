<script lang="ts">
  import { onMount } from "svelte";
  import type { RuntimeContext } from "../../../core/runtime-context";
  import type { AuthSession, BenchUser } from "../domain/session";
  import { fetchUsers, loginAs } from "../application/auth-api";

  let {
    ctx,
    onLoggedIn,
  }: {
    ctx: RuntimeContext;
    onLoggedIn: (session: AuthSession) => void;
  } = $props();

  let users = $state<BenchUser[]>([]);
  let error = $state("");
  let busy = $state(false);

  onMount(() => {
    void fetchUsers(ctx.apiBase)
      .then((list) => {
        users = list;
      })
      .catch((e) => {
        error = e instanceof Error ? e.message : String(e);
      });
  });

  async function pickUser(userId: string) {
    busy = true;
    error = "";
    try {
      const session = await loginAs(ctx.apiBase, userId);
      onLoggedIn(session);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }
</script>

<main class="shell">
  <div class="brand">
    <strong>fireweave</strong>
    <span>fixture · sign in</span>
  </div>
  <h1>Choose a user</h1>
  <p class="lede">
    Dummy bench users from the identity seed — pick one to complete login.
  </p>
  {#if error}
    <pre class="probe bad">{error}</pre>
  {/if}
  <ul class="user-list">
    {#each users as u (u.id)}
      <li>
        <button type="button" disabled={busy} onclick={() => pickUser(u.id)}>
          <strong>{u.name}</strong>
          <span>{u.email}</span>
          <em>{u.org} · {u.plan} · {u.country}</em>
        </button>
      </li>
    {/each}
  </ul>
</main>
