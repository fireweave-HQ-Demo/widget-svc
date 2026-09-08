import { useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession } from "../../identity/domain/session";
import { clearSession } from "../../identity/application/auth-api";
import { buildHomeModel } from "../application/home-model";
import { probeApi } from "../application/probe-api";
import { fw } from "../../../fireweave/fw-harness";
import { emitAllMetricTypes } from "../../telemetry/infrastructure/emit-metric-types";
import { increment, record } from "../../telemetry/infrastructure/start-browser-otel";

export function HomePage({
  ctx,
  session,
}: {
  ctx: RuntimeContext;
  session?: AuthSession | null;
}) {
  const model = buildHomeModel(ctx);
  const [probe, setProbe] = useState("Idle — probe the pair API.");
  const [klass, setKlass] = useState("");
  const [metricTypesProbe, setMetricTypesProbe] = useState("Idle — metric types probe.");
  const [metricTypesKlass, setMetricTypesKlass] = useState("");
  const [homeProbe, setHomeProbe] = useState("Idle — home probe metrics.");
  const [homeProbeKlass, setHomeProbeKlass] = useState("");
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

  return (
    <main className="shell">
      <div className="brand"><strong>fireweave</strong><span>fixture · react</span></div>
      <h1>{model.title}</h1>
      <p className="lede">Vite + React pair UI. Probes the sibling API over the host-mapped port.</p>
      {session ? (
        <dl className="card">
          <div className="row"><dt>Signed in</dt><dd>{session.user.name} ({session.user.email})</dd></div>
          <div className="row"><dt>Evaluation</dt><dd>{session.evaluationContext.distinctId}</dd></div>
          <div className="row"><dt>Org / plan</dt><dd>{session.user.org} · {session.user.plan}</dd></div>
        </dl>
      ) : null}
      <dl className="card">
        <div className="row"><dt>Environment</dt><dd>{model.environment}</dd></div>
        <div className="row"><dt>Destination</dt><dd>{model.destination}</dd></div>
        <div className="row"><dt>Framework</dt><dd>{model.framework}</dd></div>
        <div className="row"><dt>API</dt><dd>{model.apiBase}</dd></div>
        <div className="row"><dt>Browser OTLP</dt><dd>{model.otlp}</dd></div>
      </dl>
      <div className="actions">
        <button
          type="button"
          onClick={async () => {
            const result = await probeApi(ctx.apiBase);
            setProbe(result.body);
            setKlass(result.ok ? "ok" : "bad");
          }}
        >
          Probe API /health
        </button>
        {homeProbeEnabled ? (
          <button
            type="button"
            onClick={async () => {
              try {
                await increment(ctx, "feature.home-probe.adopted");
                const res = await fetch(`${ctx.apiBase}/probe/metrics`);
                const body = await res.text();
                setHomeProbe(body);
                setHomeProbeKlass(res.ok ? "ok" : "bad");
                if (!res.ok) await increment(ctx, "feature.home-probe.error");
              } catch (e) {
                await increment(ctx, "feature.home-probe.error");
                setHomeProbe(e instanceof Error ? e.message : String(e));
                setHomeProbeKlass("bad");
              }
            }}
          >
            Probe /probe/metrics
          </button>
        ) : null}
        {metricTypesEnabled ? (
          <button
            type="button"
            onClick={async () => {
              try {
                const emitted = await emitAllMetricTypes(ctx);
                await increment(ctx, "feature.metric-types.adopted");
                await record(ctx, "feature.metric-types.histogram", 12.5);
                setMetricTypesProbe(JSON.stringify({ ok: true, emitted }, null, 2));
                setMetricTypesKlass("ok");
              } catch (e) {
                await increment(ctx, "feature.metric-types.error");
                setMetricTypesProbe(e instanceof Error ? e.message : String(e));
                setMetricTypesKlass("bad");
              }
            }}
          >
            Emit all metric types
          </button>
        ) : null}
        {session ? (
          <button
            type="button"
            className="link"
            onClick={() => {
              clearSession();
              location.reload();
            }}
          >
            Sign out
          </button>
        ) : null}
        <a className="link" href={`${model.apiBase}/health`} target="_blank" rel="noreferrer">
          Open API health
        </a>
      </div>
      <pre className={`probe ${klass}`}>{probe}</pre>
      {homeProbeEnabled ? (
        <pre className={`probe ${homeProbeKlass}`}>{homeProbe}</pre>
      ) : null}
      {metricTypesEnabled ? (
        <pre className={`probe ${metricTypesKlass}`}>{metricTypesProbe}</pre>
      ) : null}
    </main>
  );
}
