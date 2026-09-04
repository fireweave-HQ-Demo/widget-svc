import { createSignal } from "solid-js";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession } from "../../identity/domain/session";
import { clearSession } from "../../identity/application/auth-api";
import { buildHomeModel } from "../application/home-model";
import { probeApi } from "../application/probe-api";

export function HomePage(props: {
  ctx: RuntimeContext;
  session?: AuthSession | null;
}) {
  const model = buildHomeModel(props.ctx);
  const [probe, setProbe] = createSignal("Idle — probe the pair API.");
  const [klass, setKlass] = createSignal("");

  return (
    <main class="shell">
      <div class="brand"><strong>fireweave</strong><span>fixture · solid</span></div>
      <h1>{model.title}</h1>
      <p class="lede">Vite + Solid pair UI. Probes the sibling API over the host-mapped port.</p>
      {props.session ? (
        <dl class="card">
          <div class="row"><dt>Signed in</dt><dd>{props.session.user.name} ({props.session.user.email})</dd></div>
          <div class="row"><dt>Evaluation</dt><dd>{props.session.evaluationContext.distinctId}</dd></div>
          <div class="row"><dt>Org / plan</dt><dd>{props.session.user.org} · {props.session.user.plan}</dd></div>
        </dl>
      ) : null}
      <dl class="card">
        <div class="row"><dt>Environment</dt><dd>{model.environment}</dd></div>
        <div class="row"><dt>Destination</dt><dd>{model.destination}</dd></div>
        <div class="row"><dt>Framework</dt><dd>{model.framework}</dd></div>
        <div class="row"><dt>API</dt><dd>{model.apiBase}</dd></div>
        <div class="row"><dt>Browser OTLP</dt><dd>{model.otlp}</dd></div>
      </dl>
      <div class="actions">
        <button
          type="button"
          onClick={async () => {
            const result = await probeApi(props.ctx.apiBase);
            setProbe(result.body);
            setKlass(result.ok ? "ok" : "bad");
          }}
        >
          Probe API /health
        </button>
        {props.session ? (
          <button
            type="button"
            class="link"
            onClick={() => {
              clearSession();
              location.reload();
            }}
          >
            Sign out
          </button>
        ) : null}
        <a class="link" href={`${model.apiBase}/health`} target="_blank" rel="noreferrer">
          Open API health
        </a>
      </div>
      <pre class={`probe ${klass()}`}>{probe()}</pre>
    </main>
  );
}
