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

export async function fetchActivityFeed(
  apiBase: string,
  sessionToken: string,
): Promise<ActivityFeedResponse> {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/activity/feed`, {
    headers: { authorization: `Bearer ${sessionToken}` },
  });
  if (!res.ok) {
    throw new Error(`activity feed ${res.status}`);
  }
  return (await res.json()) as ActivityFeedResponse;
}
