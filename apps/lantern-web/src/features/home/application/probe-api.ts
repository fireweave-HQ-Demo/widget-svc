export async function probeApi(
  apiBase: string,
  useMetricsProbe = false,
): Promise<{ ok: boolean; body: string }> {
  const path = useMetricsProbe ? "/probe/metrics" : "/health";
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}${path}`);
    const body = await res.text();
    return { ok: res.ok, body };
  } catch (e) {
    return { ok: false, body: e instanceof Error ? e.message : String(e) };
  }
}
