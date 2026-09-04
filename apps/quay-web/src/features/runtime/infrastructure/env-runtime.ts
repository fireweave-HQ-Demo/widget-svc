import type { RuntimeContext } from "../../../core/runtime-context";

function endpointFromEnv(
  explicit: string | undefined,
  port: string | undefined,
  fallbackPort: number,
): string {
  if (explicit) return explicit;
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:${port || fallbackPort}`;
  }
  return `http://127.0.0.1:${port || fallbackPort}`;
}

export function loadRuntimeFromEnv(fallbackService: string, framework: string): RuntimeContext {
  return {
    service: import.meta.env.VITE_SERVICE_NAME || fallbackService,
    environment: import.meta.env.VITE_APP_ENV || "dev",
    destination: import.meta.env.VITE_DESTINATION || "control",
    apiBase: endpointFromEnv(import.meta.env.VITE_API_BASE, import.meta.env.VITE_API_PORT, 3000),
    exporterEndpoint: endpointFromEnv(import.meta.env.VITE_OTEL_ENDPOINT, import.meta.env.VITE_OTEL_PORT, 4318),
    framework,
    identityEnabled: import.meta.env.VITE_IDENTITY_ENABLED === "true",
  };
}
