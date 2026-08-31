<script lang="ts">
  import { onMount } from "svelte";
  import type { RuntimeContext } from "../../../core/runtime-context";
  import type { AuthSession } from "../../identity/domain/session";
  import { fw } from "../../../../fireweave/fw-harness";
  import { increment } from "../../telemetry/infrastructure/start-browser-otel";
  import {
    fetchActivityFeed,
    type ActivityItem,
  } from "../application/fetch-activity-feed";

  let {
    ctx,
    session,
  }: {
    ctx: RuntimeContext;
    session: AuthSession;
  } = $props();

  let visible = $state(false);
  let items = $state<ActivityItem[]>([]);
  let error = $state("");
  let loading = $state(false);

  async function load() {
    loading = true;
    error = "";
    try {
      const data = await fetchActivityFeed(ctx.apiBase, session.sessionToken);
      items = data.items;
      await increment(ctx, "feature.activity_feed.fetch_ok", 1, {
        plan: session.user.plan,
      });
    } catch {
      items = [];
      error = "Could not load activity feed.";
      await increment(ctx, "feature.activity_feed.fetch_failed", 1, {
        plan: session.user.plan,
      });
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // @fireweave-controlpoint activity-feed
    const enabled = fw.controlPoints.getBooleanValue("activity-feed", false);
    if (!enabled) return;
    visible = true;
    void increment(ctx, "feature.activity_feed.exposed", 1, {
      plan: session.user.plan,
    });
    void load();
  });
</script>

{#if visible}
  <section class="card activity-feed">
    <h2>Recent activity</h2>
    <p class="lede">Latest events for your account.</p>
    {#if loading}
      <p>Loading…</p>
    {/if}
    {#if error}
      <pre class="probe bad">{error}</pre>
    {/if}
    {#if items.length > 0}
      <ul class="notice-list">
        {#each items as item (item.id)}
          <li class="notice notice-{item.kind}">
            <strong>{item.at}</strong> — {item.summary}
          </li>
        {/each}
      </ul>
    {/if}
    <button type="button" onclick={() => void load()} disabled={loading}>
      Refresh
    </button>
  </section>
{/if}
