export async function probeApi(apiBase: string): Promise<{ ok: boolean; body: string }> {
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/health`);
    const body = await res.text();
    return { ok: res.ok, body };
  } catch (e) {
    return { ok: false, body: e instanceof Error ? e.message : String(e) };
  }
}
