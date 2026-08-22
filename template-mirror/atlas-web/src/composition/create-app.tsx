import { HomePage } from "../features/home/presentation/HomePage";
import {
  LoginPage,
  useAuthGate,
} from "../features/identity/presentation/LoginPage";
import { loadRuntimeFromEnv } from "../features/runtime/infrastructure/env-runtime";
import { startBrowserOtel } from "../features/telemetry/infrastructure/start-browser-otel";

const ctx = loadRuntimeFromEnv("atlas-web", "react");
void startBrowserOtel(ctx);

export function App() {
  const { session, setSession, loading } = useAuthGate(ctx);

  if (loading) {
    return (
      <main className="shell">
        <p className="lede">Loading…</p>
      </main>
    );
  }

  if (ctx.identityEnabled && !session) {
    return <LoginPage ctx={ctx} onLoggedIn={setSession} />;
  }

  return <HomePage ctx={ctx} session={session} />;
}
