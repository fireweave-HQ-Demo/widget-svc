<script lang="ts">
  import { onMount } from "svelte";
  import type { RuntimeContext } from "../../../core/runtime-context";
  import type { AuthSession } from "../../identity/domain/session";
  import { fw } from "../../../../fireweave/fw-harness";
  import { increment } from "../../telemetry/infrastructure/start-browser-otel";
  import {
    fetchUsageSummary,
    type UsageSummary,
  } from "../application/fetch-usage-summary";

  let {
    ctx,
    session,
  }: {
    ctx: RuntimeContext;
    session: AuthSession;
  } = $props();

  let visible = $state(false);
  let summary = $state<UsageSummary | null>(null);
  let error = $state("");
  let loading = $state(false);

  async function load() {
    loading = true;
    error = "";
    try {
      const data = await fetchUsageSummary(ctx.apiBase, session.sessionToken);
      summary = data;
      await increment(ctx, "feature.usage_insights.fetch_ok", 1, {
        plan: session.user.plan,
      });
    } catch {
      summary = null;
      error = "Could not load usage snapshot.";
      await increment(ctx, "feature.usage_insights.fetch_failed", 1, {
        plan: session.user.plan,
      });
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // @fireweave-controlpoint usage-insights
    const enabled = fw.controlPoints.getBooleanValue("usage-insights", false);
    if (!enabled) return;
    visible = true;
    void increment(ctx, "feature.usage_insights.exposed", 1, {
      plan: session.user.plan,
    });
    void load();
  });
</script>

{#if visible}
  <section class="card usage-snapshot">
    <h2>Usage snapshot</h2>
    <p class="lede">Last 30 days for your account.</p>
    {#if loading}
      <p>Loading…</p>
    {/if}
    {#if error}
      <pre class="probe bad">{error}</pre>
    {/if}
    {#if summary}
      <dl>
        <div class="row"><dt>Period</dt><dd>{summary.period}</dd></div>
        <div class="row"><dt>Requests</dt><dd>{summary.requests.toLocaleString()}</dd></div>
        <div class="row"><dt>Plan</dt><dd>{summary.plan}</dd></div>
        <div class="row">
          <dt>Monthly limit</dt>
          <dd>{summary.limits.requestsPerMonth.toLocaleString()}</dd>
        </div>
      </dl>
    {/if}
    <button type="button" onclick={() => void load()} disabled={loading}>
      Refresh
    </button>
  </section>
{/if}
