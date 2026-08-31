<script lang="ts">
  import type { RuntimeContext } from "../../../core/runtime-context";
  import type { AuthSession } from "../../identity/domain/session";
  import { clearSession } from "../../identity/application/auth-api";
  import { buildHomeModel } from "../application/home-model";
  import { probeApi } from "../application/probe-api";
  import PlanNoticesPanel from "../../plan-notices/presentation/PlanNoticesPanel.svelte";
  import ActivityFeedPanel from "../../activity-feed/presentation/ActivityFeedPanel.svelte";

  let {
    ctx,
    session = null,
  }: {
    ctx: RuntimeContext;
    session?: AuthSession | null;
  } = $props();

  const model = $derived(buildHomeModel(ctx));
  let probe = $state("Idle — probe the pair API.");
  let klass = $state("");

  async function onProbe() {
    const result = await probeApi(ctx.apiBase);
    probe = result.body;
    klass = result.ok ? "ok" : "bad";
  }

  function onSignOut() {
    clearSession();
    location.reload();
  }
</script>

<main class="shell">
  <div class="brand"><strong>fireweave</strong><span>fixture · svelte</span></div>
  <h1>{model.title}</h1>
  <p class="lede">Vite + Svelte pair UI. Probes the sibling API over the host-mapped port.</p>
  {#if session}
    <dl class="card">
      <div class="row"><dt>Signed in</dt><dd>{session.user.name} ({session.user.email})</dd></div>
      <div class="row"><dt>Evaluation</dt><dd>{session.evaluationContext.distinctId}</dd></div>
      <div class="row"><dt>Org / plan</dt><dd>{session.user.org} · {session.user.plan}</dd></div>
    </dl>
  {/if}
  {#if session}
    <PlanNoticesPanel {ctx} {session} />
    <ActivityFeedPanel {ctx} {session} />
  {/if}
  <dl class="card">
    <div class="row"><dt>Environment</dt><dd>{model.environment}</dd></div>
    <div class="row"><dt>Destination</dt><dd>{model.destination}</dd></div>
    <div class="row"><dt>Framework</dt><dd>{model.framework}</dd></div>
    <div class="row"><dt>API</dt><dd>{model.apiBase}</dd></div>
    <div class="row"><dt>Browser OTLP</dt><dd>{model.otlp}</dd></div>
  </dl>
  <div class="actions">
    <button type="button" onclick={onProbe}>Probe API /health</button>
    {#if session}
      <button type="button" class="link" onclick={onSignOut}>Sign out</button>
    {/if}
    <a class="link" href="{model.apiBase}/health" target="_blank" rel="noreferrer">Open API health</a>
  </div>
  <pre class="probe {klass}">{probe}</pre>
</main>
