export type RuntimeContext = {
  service: string;
  environment: string;
  destination: string;
  apiBase: string;
  exporterEndpoint: string;
  framework: string;
  identityEnabled: boolean;
};
