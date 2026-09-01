export type ThemeTokens = {
  name: string;
  accent: string;
  wash: string;
  panel: string;
  ink: string;
};

export type ThemePayload = {
  service: string;
  theme: ThemeTokens;
};

export async function fetchTheme(
  apiBase: string,
  sessionToken?: string,
): Promise<{ ok: true; payload: ThemePayload } | { ok: false; status: number; body: string }> {
  try {
    const headers: HeadersInit = {};
    if (sessionToken) headers.authorization = `Bearer ${sessionToken}`;
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/theme`, { headers });
    const body = await res.text();
    if (!res.ok) return { ok: false, status: res.status, body };
    return { ok: true, payload: JSON.parse(body) as ThemePayload };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      body: e instanceof Error ? e.message : String(e),
    };
  }
}

export function applyThemeTokens(theme: ThemeTokens): void {
  const root = document.documentElement.style;
  root.setProperty("--accent", theme.accent);
  root.setProperty("--wash", theme.wash);
  root.setProperty("--panel", theme.panel);
  root.setProperty("--ink", theme.ink);
}
