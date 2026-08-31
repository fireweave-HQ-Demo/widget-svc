<script lang="ts">
  import { onMount } from "svelte";
  import type { RuntimeContext } from "../../../core/runtime-context";
  import type { AuthSession } from "../../identity/domain/session";
  import { fw } from "../../../../fireweave/fw-harness";
  import { increment } from "../../telemetry/infrastructure/start-browser-otel";
  import {
    fetchPlanNotices,
    type PlanNotice,
  } from "../application/fetch-plan-notices";

  let {
    ctx,
    session,
  }: {
    ctx: RuntimeContext;
    session: AuthSession;
  } = $props();

  let visible = $state(false);
  let notices = $state<PlanNotice[]>([]);
  let error = $state("");
  let loading = $state(false);

  async function load() {
    loading = true;
    error = "";
    try {
      const data = await fetchPlanNotices(ctx.apiBase, session.sessionToken);
      notices = data.notices;
      await increment(ctx, "feature.plan_notices.fetch_ok", 1, {
        plan: session.user.plan,
      });
    } catch {
      notices = [];
      error = "Could not load plan notices.";
      await increment(ctx, "feature.plan_notices.fetch_failed", 1, {
        plan: session.user.plan,
      });
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // @fireweave-controlpoint plan-notices
    const enabled = fw.controlPoints.getBooleanValue("plan-notices", false);
    if (!enabled) return;
    visible = true;
    void increment(ctx, "feature.plan_notices.exposed", 1, {
      plan: session.user.plan,
    });
    void load();
  });
</script>

{#if visible}
  <section class="card plan-notices">
    <h2>Plan notices</h2>
    <p class="lede">Account and billing reminders for your plan.</p>
    {#if loading}
      <p>Loading…</p>
    {/if}
    {#if error}
      <pre class="probe bad">{error}</pre>
    {/if}
    {#if notices.length > 0}
      <ul class="notice-list">
        {#each notices as notice (notice.id)}
          <li class="notice notice-{notice.severity}">{notice.message}</li>
        {/each}
      </ul>
    {/if}
    <button type="button" onclick={() => void load()} disabled={loading}>
      Refresh
    </button>
  </section>
{/if}
