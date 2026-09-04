import { Show } from "solid-js";
import { HomePage } from "../features/home/presentation/HomePage";
import {
  LoginPage,
  useAuthGate,
} from "../features/identity/presentation/LoginPage";
import { loadRuntimeFromEnv } from "../features/runtime/infrastructure/env-runtime";
import { startBrowserOtel } from "../features/telemetry/infrastructure/start-browser-otel";

const ctx = loadRuntimeFromEnv("quay-web", "solid");
void startBrowserOtel(ctx);

export function App() {
  const { session, setSession, loading } = useAuthGate(ctx);

  return (
    <>
      <Show when={loading()}>
        <main class="shell">
          <p class="lede">Loading…</p>
        </main>
      </Show>
      <Show when={!loading() && ctx.identityEnabled && !session()}>
        <LoginPage ctx={ctx} onLoggedIn={setSession} />
      </Show>
      <Show when={!loading() && (!ctx.identityEnabled || session())}>
        <HomePage ctx={ctx} session={session()} />
      </Show>
    </>
  );
}
