export type ProbeMode = "health" | "metrics" | "metric-types";

export async function probeApi(
  apiBase: string,
  mode: ProbeMode = "health",
): Promise<{ ok: boolean; body: string }> {
  const path =
    mode === "metric-types"
      ? "/probe/metric-types"
      : mode === "metrics"
        ? "/probe/metrics"
        : "/health";
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}${path}`);
    const body = await res.text();
    return { ok: res.ok, body };
  } catch (e) {
    return { ok: false, body: e instanceof Error ? e.message : String(e) };
  }
}
