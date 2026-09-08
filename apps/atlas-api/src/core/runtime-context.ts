/** Proven-shared runtime identity for this service (not a dumping ground). */
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
