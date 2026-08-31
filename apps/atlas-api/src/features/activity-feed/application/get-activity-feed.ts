import type { BenchUser } from "../../identity/domain/user";
import { userIndex } from "../../identity/domain/user";

export type ActivityItem = {
  id: string;
  kind: "login" | "api" | "billing";
  summary: string;
  at: string;
};

export type ActivityFeedResponse = {
  items: ActivityItem[];
  plan: string;
};

/** Deterministic bench activity derived from the signed-in user. */
export function getActivityFeed(user: BenchUser): ActivityFeedResponse {
  const idx = userIndex(user.id);
  const day = (offset: number) => {
    const d = new Date(Date.UTC(2026, 7, 20 + (idx % 7) - offset));
    return d.toISOString().slice(0, 10);
  };
  return {
    plan: user.plan,
    items: [
      {
        id: `act_${idx}_login`,
        kind: "login",
        summary: `${user.name} signed in from ${user.country}`,
        at: day(0),
      },
      {
        id: `act_${idx}_api`,
        kind: "api",
        summary: `API usage spike: ${120 + idx * 17} requests`,
        at: day(1),
      },
      {
        id: `act_${idx}_billing`,
        kind: "billing",
        summary:
          user.plan === "free"
            ? "Free plan still active"
            : `${user.plan} plan invoice generated`,
        at: day(3),
      },
    ],
  };
}
