export type PlanNotice = {
  id: string;
  severity: "info" | "warn";
  message: string;
};

export type PlanNoticesResponse = {
  notices: PlanNotice[];
  plan: string;
};

export async function fetchPlanNotices(
  apiBase: string,
  sessionToken: string,
): Promise<PlanNoticesResponse> {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/plan/notices`, {
    headers: { authorization: `Bearer ${sessionToken}` },
  });
  if (!res.ok) {
    throw new Error(`plan notices ${res.status}`);
  }
  return (await res.json()) as PlanNoticesResponse;
}
