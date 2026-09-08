import { useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession } from "../../identity/domain/session";
import { clearSession } from "../../identity/application/auth-api";
import { buildHomeModel } from "../application/home-model";
import { probeApi } from "../application/probe-api";
import { increment, setGauge, record, addUpDown, emitExponentialHistogram } from "../../telemetry/infrastructure/start-browser-otel";
import { fw } from "../../../fireweave/fw-harness";

const METRIC_ADOPTED = "feature.home-probe.adopted";
const METRIC_ERROR = "feature.home-probe.error";
const METRIC_TYPES_ADOPTED = "feature.metric-types.adopted";
const METRIC_TYPES_ERROR = "feature.metric-types.error";
const METRIC_TYPES_COUNTER = "feature.metric-types.counter";
const METRIC_TYPES_GAUGE = "feature.metric-types.gauge";
const METRIC_TYPES_HISTOGRAM = "feature.metric-types.histogram";
const METRIC_TYPES_UPDOWN = "feature.metric-types.updown";
const METRIC_TYPES_EXP_HISTOGRAM = "feature.metric-types.exponential_histogram";

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
            // @fireweave-flag home-probe-metrics
            const metricsProbe = fw.controlPoints.getBooleanValue(
              "home-probe-metrics",
              false,
            );
            const result = await probeApi(
              ctx.apiBase,
              metricsProbe ? "metrics" : "health",
            );
            if (metricsProbe) {
              if (result.ok) {
                await increment(ctx, METRIC_ADOPTED);
              } else {
                await increment(ctx, METRIC_ERROR);
              }
            }
            setProbe(result.body);
            setKlass(result.ok ? "ok" : "bad");
          }}
        >
          Probe API /health
        </button>
        <button
          type="button"
          onClick={async () => {
            // @fireweave-flag metric-types-probe
            const enabled = fw.controlPoints.getBooleanValue(
              "metric-types-probe",
              false,
            );
            const result = await probeApi(
              ctx.apiBase,
              enabled ? "metric-types" : "health",
            );
            if (enabled) {
              if (result.ok) {
                await increment(ctx, METRIC_TYPES_COUNTER);
                await setGauge(ctx, METRIC_TYPES_GAUGE, 42);
                await record(ctx, METRIC_TYPES_HISTOGRAM, 12.5);
                await addUpDown(ctx, METRIC_TYPES_UPDOWN, 1);
                await emitExponentialHistogram(ctx, METRIC_TYPES_EXP_HISTOGRAM, 8);
                await increment(ctx, METRIC_TYPES_ADOPTED);
              } else {
                await increment(ctx, METRIC_TYPES_ERROR);
              }
            }
            setProbe(result.body);
            setKlass(result.ok ? "ok" : "bad");
          }}
        >
          Emit all metric types
        </button>
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
    </main>
  );
}
