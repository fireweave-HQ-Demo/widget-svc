import { useEffect, useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession } from "../../identity/domain/session";
import { fw } from "../../../../fireweave/fw-harness";
import { increment } from "../../telemetry/infrastructure/start-browser-otel";
import {
  fetchUsageSummary,
  type UsageSummary,
} from "../application/fetch-usage-summary";

export function UsageInsightsPanel({
  ctx,
  session,
}: {
  ctx: RuntimeContext;
  session: AuthSession;
}) {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // @fireweave-controlpoint usage-insights
    const enabled = fw.controlPoints.getBooleanValue("usage-insights", false);
    if (!enabled) return;
    setVisible(true);
    void increment(ctx, "feature.usage_insights.exposed", 1, {
      plan: session.user.plan,
    });
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchUsageSummary(ctx.apiBase, session.sessionToken);
        setSummary(data);
        await increment(ctx, "feature.usage_insights.fetch_ok", 1, {
          plan: session.user.plan,
        });
      } catch {
        setSummary(null);
        setError("Could not load usage snapshot.");
        await increment(ctx, "feature.usage_insights.fetch_failed", 1, {
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
      const data = await fetchUsageSummary(ctx.apiBase, session.sessionToken);
      setSummary(data);
      await increment(ctx, "feature.usage_insights.fetch_ok", 1, {
        plan: session.user.plan,
      });
    } catch {
      setSummary(null);
      setError("Could not load usage snapshot.");
      await increment(ctx, "feature.usage_insights.fetch_failed", 1, {
        plan: session.user.plan,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <section className="card usage-snapshot">
      <h2>Usage snapshot</h2>
      <p className="lede">Last 30 days for your account.</p>
      {loading ? <p>Loading…</p> : null}
      {error ? <pre className="probe bad">{error}</pre> : null}
      {summary ? (
        <dl>
          <div className="row">
            <dt>Period</dt>
            <dd>{summary.period}</dd>
          </div>
          <div className="row">
            <dt>Requests</dt>
            <dd>{summary.requests.toLocaleString()}</dd>
          </div>
          <div className="row">
            <dt>Plan</dt>
            <dd>{summary.plan}</dd>
          </div>
          <div className="row">
            <dt>Monthly limit</dt>
            <dd>{summary.limits.requestsPerMonth.toLocaleString()}</dd>
          </div>
        </dl>
      ) : null}
      <button type="button" onClick={() => void load()} disabled={loading}>
        Refresh
      </button>
    </section>
  );
}
