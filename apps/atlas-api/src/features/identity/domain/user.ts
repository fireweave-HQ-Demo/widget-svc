export type BenchUser = {
  id: string;
  email: string;
  name: string;
  org: string;
  plan: "free" | "pro" | "enterprise";
  country: string;
};

export type EvaluationContext = {
  distinctId: string;
  properties: {
    email: string;
    name: string;
    org: string;
    plan: string;
    country: string;
    signupDate: string;
    beta: boolean;
  };
};

export function userIndex(id: string): number {
  const n = Number.parseInt(id.replace(/^user_/, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/** Deterministic cohort attrs — same formula in every language. */
export function toEvaluationContext(user: BenchUser): EvaluationContext {
  const idx = userIndex(user.id);
  const base = Date.UTC(2020, 0, 1);
  const signup = new Date(base + idx * 86_400_000);
  return {
    distinctId: user.id,
    properties: {
      email: user.email,
      name: user.name,
      org: user.org,
      plan: user.plan,
      country: user.country,
      signupDate: signup.toISOString().slice(0, 10),
      beta: idx % 3 === 0,
    },
  };
}
