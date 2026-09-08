<script lang="ts">
  import type { RuntimeContext } from "../../../core/runtime-context";
  import type { AuthSession } from "../../identity/domain/session";
  import { clearSession } from "../../identity/application/auth-api";
  import { buildHomeModel } from "../application/home-model";
  import { probeApi } from "../application/probe-api";
  import { fw } from "../../../fireweave/fw-harness";
  import { emitAllMetricTypes } from "../../telemetry/infrastructure/emit-metric-types";
  import { increment, record } from "../../telemetry/infrastructure/start-browser-otel";

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
  let metricTypesProbe = $state("Idle — metric types probe.");
  let metricTypesKlass = $state("");
  let homeProbe = $state("Idle — home probe metrics.");
  let homeProbeKlass = $state("");
  // @fireweave-controlpoint home-probe-metrics
  const homeProbeEnabled = fw.controlPoints.getBooleanValue(
    "home-probe-metrics",
    false,
  );
  // @fireweave-controlpoint metric-types-probe
  const metricTypesEnabled = fw.controlPoints.getBooleanValue(
    "metric-types-probe",
    false,
  );

  async function onProbe() {
    const result = await probeApi(ctx.apiBase);
    probe = result.body;
    klass = result.ok ? "ok" : "bad";
  }

  async function onHomeProbe() {
    try {
      await increment(ctx, "feature.home-probe.adopted");
      const res = await fetch(`${ctx.apiBase}/probe/metrics`);
      homeProbe = await res.text();
      homeProbeKlass = res.ok ? "ok" : "bad";
      if (!res.ok) await increment(ctx, "feature.home-probe.error");
    } catch (e) {
      await increment(ctx, "feature.home-probe.error");
      homeProbe = e instanceof Error ? e.message : String(e);
      homeProbeKlass = "bad";
    }
  }

  async function onMetricTypesProbe() {
    try {
      const emitted = await emitAllMetricTypes(ctx);
      await increment(ctx, "feature.metric-types.adopted");
      await record(ctx, "feature.metric-types.histogram", 12.5);
      metricTypesProbe = JSON.stringify({ ok: true, emitted }, null, 2);
      metricTypesKlass = "ok";
    } catch (e) {
      await increment(ctx, "feature.metric-types.error");
      metricTypesProbe = e instanceof Error ? e.message : String(e);
      metricTypesKlass = "bad";
    }
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
  <dl class="card">
    <div class="row"><dt>Environment</dt><dd>{model.environment}</dd></div>
    <div class="row"><dt>Destination</dt><dd>{model.destination}</dd></div>
    <div class="row"><dt>Framework</dt><dd>{model.framework}</dd></div>
    <div class="row"><dt>API</dt><dd>{model.apiBase}</dd></div>
    <div class="row"><dt>Browser OTLP</dt><dd>{model.otlp}</dd></div>
  </dl>
  <div class="actions">
    <button type="button" onclick={onProbe}>Probe API /health</button>
    {#if homeProbeEnabled}
      <button type="button" onclick={onHomeProbe}>Probe /probe/metrics</button>
    {/if}
    {#if metricTypesEnabled}
      <button type="button" onclick={onMetricTypesProbe}>Emit all metric types</button>
    {/if}
    {#if session}
      <button type="button" class="link" onclick={onSignOut}>Sign out</button>
    {/if}
    <a class="link" href="{model.apiBase}/health" target="_blank" rel="noreferrer">Open API health</a>
  </div>
  <pre class="probe {klass}">{probe}</pre>
  {#if homeProbeEnabled}
    <pre class="probe {homeProbeKlass}">{homeProbe}</pre>
  {/if}
  {#if metricTypesEnabled}
    <pre class="probe {metricTypesKlass}">{metricTypesProbe}</pre>
  {/if}
</main>
