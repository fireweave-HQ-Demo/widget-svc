import type { RuntimeContext } from "../../../core/runtime-context";

export function loadRuntimeFromEnv(fallbackService: string, framework: string): RuntimeContext {
  return {
    service: import.meta.env.VITE_SERVICE_NAME || fallbackService,
    environment: import.meta.env.VITE_APP_ENV || "dev",
    destination: import.meta.env.VITE_DESTINATION || "control",
    apiBase: import.meta.env.VITE_API_BASE || "http://127.0.0.1:3000",
    exporterEndpoint: import.meta.env.VITE_OTEL_ENDPOINT || "http://127.0.0.1:4318",
    framework,
  };
}
