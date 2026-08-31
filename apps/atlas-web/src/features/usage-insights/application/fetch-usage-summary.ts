export type UsageSummary = {
  period: "30d";
  requests: number;
  plan: string;
  limits: { requestsPerMonth: number; seats: number };
};

export async function fetchUsageSummary(
  apiBase: string,
  sessionToken: string,
): Promise<UsageSummary> {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/usage/summary`, {
    headers: { authorization: `Bearer ${sessionToken}` },
  });
  if (!res.ok) {
    throw new Error(`usage summary ${res.status}`);
  }
  return (await res.json()) as UsageSummary;
}
