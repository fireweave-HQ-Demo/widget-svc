<script lang="ts">
  import { onMount } from "svelte";
  import HomePage from "../features/home/presentation/HomePage.svelte";
  import LoginPage from "../features/identity/presentation/LoginPage.svelte";
  import { restoreSession } from "../features/identity/application/auth-api";
  import type { AuthSession } from "../features/identity/domain/session";
  import { loadRuntimeFromEnv } from "../features/runtime/infrastructure/env-runtime";
  import { startBrowserOtel } from "../features/telemetry/infrastructure/start-browser-otel";

  const ctx = loadRuntimeFromEnv("lantern-web", "svelte");
  void startBrowserOtel(ctx);

  let session = $state<AuthSession | null | undefined>(undefined);

  onMount(() => {
    if (!ctx.identityEnabled) {
      session = null;
      return;
    }
    void restoreSession(ctx.apiBase)
      .then((value) => {
        session = value;
      })
      .catch(() => {
        session = null;
      });
  });

  function setSession(value: AuthSession | null) {
    session = value;
  }
</script>

{#if session === undefined}
  <main class="shell">
    <p class="lede">Loading…</p>
  </main>
{:else if ctx.identityEnabled && !session}
  <LoginPage {ctx} onLoggedIn={setSession} />
{:else}
  <HomePage {ctx} {session} />
{/if}
