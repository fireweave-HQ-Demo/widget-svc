export type RuntimeContext = {
  service: string;
  environment: string;
  destination: string;
  exporterEndpoint: string;
};

export function createRuntimeContext(input: {
  service: string;
  environment: string;
  destination: string;
  exporterEndpoint: string;
}): RuntimeContext {
  return input;
}
