export type HealthReport = {
  ok: true;
  service: string;
  environment: string;
  destination: string;
  framework: string;
  exporter: { endpoint: string; signals: string[] };
};
