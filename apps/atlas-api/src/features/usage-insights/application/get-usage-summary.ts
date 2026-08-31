import type { BenchUser } from "../../identity/domain/user";
import { userIndex } from "../../identity/domain/user";

export type UsageSummary = {
  period: "30d";
  requests: number;
  plan: string;
  limits: { requestsPerMonth: number; seats: number };
};

const LIMITS: Record<BenchUser["plan"], UsageSummary["limits"]> = {
  free: { requestsPerMonth: 1_000, seats: 1 },
  pro: { requestsPerMonth: 50_000, seats: 10 },
  enterprise: { requestsPerMonth: 500_000, seats: 100 },
};

/** Deterministic bench snapshot derived from the signed-in user. */
export function getUsageSummary(user: BenchUser): UsageSummary {
  const idx = userIndex(user.id);
  return {
    period: "30d",
    requests: 120 + idx * 17,
    plan: user.plan,
    limits: LIMITS[user.plan],
  };
}
