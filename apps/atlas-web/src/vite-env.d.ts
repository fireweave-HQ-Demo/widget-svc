/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVICE_NAME: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_DESTINATION: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_API_PORT?: string;
  readonly VITE_OTEL_ENDPOINT?: string;
  readonly VITE_OTEL_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
