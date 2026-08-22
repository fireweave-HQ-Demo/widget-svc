import { HomePage } from "../features/home/presentation/HomePage";
import { loadRuntimeFromEnv } from "../features/runtime/infrastructure/env-runtime";
import { startBrowserOtel } from "../features/telemetry/infrastructure/start-browser-otel";

const ctx = loadRuntimeFromEnv("atlas-web", "react");
void startBrowserOtel(ctx);

export function App() {
  return <HomePage ctx={ctx} />;
}
