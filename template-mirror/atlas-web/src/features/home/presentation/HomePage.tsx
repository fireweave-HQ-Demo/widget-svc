import { useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import { buildHomeModel } from "../application/home-model";
import { probeApi } from "../application/probe-api";

export function HomePage({ ctx }: { ctx: RuntimeContext }) {
  const model = buildHomeModel(ctx);
  const [probe, setProbe] = useState("Idle — probe the pair API.");
  const [klass, setKlass] = useState("");

  return (
    <main className="shell">
      <div className="brand"><strong>fireweave</strong><span>fixture · react</span></div>
      <h1>{model.title}</h1>
      <p className="lede">Vite + React pair UI. Probes the sibling API over the host-mapped port.</p>
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
        <a className="link" href={`${model.apiBase}/health`} target="_blank" rel="noreferrer">
          Open API health
        </a>
      </div>
      <pre className={`probe ${klass}`}>{probe}</pre>
    </main>
  );
}
