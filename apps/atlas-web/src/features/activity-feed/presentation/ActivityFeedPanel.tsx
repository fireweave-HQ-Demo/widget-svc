import { useEffect, useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession } from "../../identity/domain/session";
import { fw } from "../../../../fireweave/fw-harness";
import { increment } from "../../telemetry/infrastructure/start-browser-otel";
import {
  fetchActivityFeed,
  type ActivityItem,
} from "../application/fetch-activity-feed";

export function ActivityFeedPanel({
  ctx,
  session,
}: {
  ctx: RuntimeContext;
  session: AuthSession;
}) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // @fireweave-controlpoint activity-feed
    const enabled = fw.controlPoints.getBooleanValue("activity-feed", false);
    if (!enabled) return;
    setVisible(true);
    void increment(ctx, "feature.activity_feed.exposed", 1, {
      plan: session.user.plan,
    });
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchActivityFeed(ctx.apiBase, session.sessionToken);
        setItems(data.items);
        await increment(ctx, "feature.activity_feed.fetch_ok", 1, {
          plan: session.user.plan,
        });
      } catch {
        setItems([]);
        setError("Could not load activity feed.");
        await increment(ctx, "feature.activity_feed.fetch_failed", 1, {
          plan: session.user.plan,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [ctx, session.sessionToken, session.user.plan]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchActivityFeed(ctx.apiBase, session.sessionToken);
      setItems(data.items);
      await increment(ctx, "feature.activity_feed.fetch_ok", 1, {
        plan: session.user.plan,
      });
    } catch {
      setItems([]);
      setError("Could not load activity feed.");
      await increment(ctx, "feature.activity_feed.fetch_failed", 1, {
        plan: session.user.plan,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <section className="card activity-feed">
      <h2>Recent activity</h2>
      <p className="lede">Latest events for your account.</p>
      {loading ? <p>Loading…</p> : null}
      {error ? <pre className="probe bad">{error}</pre> : null}
      {items.length > 0 ? (
        <ul className="notice-list">
          {items.map((item) => (
            <li key={item.id} className={`notice notice-${item.kind}`}>
              <strong>{item.at}</strong> — {item.summary}
            </li>
          ))}
        </ul>
      ) : null}
      <button type="button" onClick={() => void load()} disabled={loading}>
        Refresh
      </button>
    </section>
  );
}
