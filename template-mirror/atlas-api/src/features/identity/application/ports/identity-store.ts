import type { BenchUser, EvaluationContext } from "../../domain/user";

export type IdentityStore = {
  enabled: boolean;
  listUsers(limit: number): BenchUser[];
  listByOrg(org: string, limit: number): BenchUser[];
  login(userId: string): { token: string; user: BenchUser; evaluationContext: EvaluationContext } | null;
  session(token: string | undefined): { user: BenchUser; evaluationContext: EvaluationContext } | null;
};
