import { useEffect, useState } from "react";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { AuthSession } from "../../identity/domain/session";
import { clearSession } from "../../identity/application/auth-api";
import { buildHomeModel } from "../application/home-model";
import { probeApi } from "../application/probe-api";
import { fw } from "../../../fireweave/fw-harness";
import { increment } from "../../telemetry/infrastructure/start-browser-otel";
import {
  applyUserTheme,
  clearUserTheme,
  themeForUser,
  type UserTheme,
} from "../../theme/domain/user-theme";

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
  const [activeTheme, setActiveTheme] = useState<UserTheme | null>(null);

  useEffect(() => {
    // @fireweave-flag user-theme
    // @fireweave-controlpoint user-theme
    const enabled = fw.controlPoints.getBooleanValue("user-theme", false);
    if (!enabled || !session?.user?.id) {
      clearUserTheme();
      setActiveTheme(null);
      return;
    }
    const theme = themeForUser(session.user.id);
    applyUserTheme(theme);
    setActiveTheme(theme);
    void increment(ctx, "user_theme.applied");
    return () => {
      clearUserTheme();
    };
  }, [ctx, session]);

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
          {activeTheme ? (
            <div className="row"><dt>Theme</dt><dd>{activeTheme.label} ({activeTheme.id})</dd></div>
          ) : null}
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
        {session ? (
          <button
            type="button"
            className="link"
            onClick={() => {
              clearSession();
              clearUserTheme();
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
