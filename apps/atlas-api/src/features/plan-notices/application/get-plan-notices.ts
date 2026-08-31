import type { BenchUser } from "../../identity/domain/user";
import { userIndex } from "../../identity/domain/user";

export type PlanNotice = {
  id: string;
  severity: "info" | "warn";
  message: string;
};

export type PlanNoticesResponse = {
  notices: PlanNotice[];
  plan: string;
};

const LIMITS: Record<BenchUser["plan"], number> = {
  free: 1_000,
  pro: 50_000,
  enterprise: 500_000,
};

/** Deterministic bench notices derived from the signed-in user. */
export function getPlanNotices(user: BenchUser): PlanNoticesResponse {
  const idx = userIndex(user.id);
  const requests = 120 + idx * 17;
  const limit = LIMITS[user.plan];
  const pct = Math.round((requests / limit) * 100);
  const notices: PlanNotice[] = [];

  if (pct >= 80) {
    notices.push({
      id: "limit-warning",
      severity: "warn",
      message: `You've used ${pct}% of your monthly request limit (${requests.toLocaleString()} / ${limit.toLocaleString()}).`,
    });
  }

  if (user.plan === "free") {
    notices.push({
      id: "upgrade-hint",
      severity: "info",
      message: "Upgrade to Pro for higher limits and priority support.",
    });
  }

  if (notices.length === 0) {
    notices.push({
      id: "all-clear",
      severity: "info",
      message: "Your plan is in good standing this month.",
    });
  }

  return { notices, plan: user.plan };
}
