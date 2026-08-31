import { useEffect, useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession } from "../../identity/domain/session";
import { fw } from "../../../../fireweave/fw-harness";
import { increment } from "../../telemetry/infrastructure/start-browser-otel";
import {
  fetchPlanNotices,
  type PlanNotice,
} from "../application/fetch-plan-notices";

export function PlanNoticesPanel({
  ctx,
  session,
}: {
  ctx: RuntimeContext;
  session: AuthSession;
}) {
  const [notices, setNotices] = useState<PlanNotice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // @fireweave-controlpoint plan-notices
    const enabled = fw.controlPoints.getBooleanValue("plan-notices", false);
    if (!enabled) return;
    setVisible(true);
    void increment(ctx, "feature.plan_notices.exposed", 1, {
      plan: session.user.plan,
    });
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchPlanNotices(ctx.apiBase, session.sessionToken);
        setNotices(data.notices);
        await increment(ctx, "feature.plan_notices.fetch_ok", 1, {
          plan: session.user.plan,
        });
      } catch {
        setNotices([]);
        setError("Could not load plan notices.");
        await increment(ctx, "feature.plan_notices.fetch_failed", 1, {
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
      const data = await fetchPlanNotices(ctx.apiBase, session.sessionToken);
      setNotices(data.notices);
      await increment(ctx, "feature.plan_notices.fetch_ok", 1, {
        plan: session.user.plan,
      });
    } catch {
      setNotices([]);
      setError("Could not load plan notices.");
      await increment(ctx, "feature.plan_notices.fetch_failed", 1, {
        plan: session.user.plan,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <section className="card plan-notices">
      <h2>Plan notices</h2>
      <p className="lede">Account and billing reminders for your plan.</p>
      {loading ? <p>Loading…</p> : null}
      {error ? <pre className="probe bad">{error}</pre> : null}
      {notices.length > 0 ? (
        <ul className="notice-list">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className={`notice notice-${notice.severity}`}
            >
              {notice.message}
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
