export type BenchUser = {
  id: string;
  email: string;
  name: string;
  org: string;
  plan: string;
  country: string;
};

export type EvaluationContext = {
  distinctId: string;
  properties: Record<string, string | boolean>;
};

export type AuthSession = {
  sessionToken: string;
  user: BenchUser;
  evaluationContext: EvaluationContext;
};
