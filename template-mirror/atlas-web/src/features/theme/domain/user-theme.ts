/** Pure domain: deterministic theme palette from a bench user id. */
export type UserTheme = {
  id: string;
  label: string;
  accent: string;
  wash: string;
  background: string;
  panel: string;
};

const PALETTES: Omit<UserTheme, "id">[] = [
  { label: "Ember", accent: "#f45100", wash: "#fff0e8", background: "#f8f8f8", panel: "#ffffff" },
  { label: "Ocean", accent: "#0077b6", wash: "#e8f4fc", background: "#f3f8fb", panel: "#ffffff" },
  { label: "Forest", accent: "#2d6a4f", wash: "#e8f5ee", background: "#f4faf6", panel: "#ffffff" },
  { label: "Violet", accent: "#7b2cbf", wash: "#f3e8ff", background: "#faf6ff", panel: "#ffffff" },
  { label: "Slate", accent: "#334155", wash: "#eef2f6", background: "#f1f5f9", panel: "#ffffff" },
  { label: "Rose", accent: "#e11d48", wash: "#ffe4ea", background: "#fff5f7", panel: "#ffffff" },
  { label: "Amber", accent: "#d97706", wash: "#fff4e0", background: "#fffaf0", panel: "#ffffff" },
  { label: "Teal", accent: "#0f766e", wash: "#e0f7f5", background: "#f0fafa", panel: "#ffffff" },
  { label: "Indigo", accent: "#4338ca", wash: "#e8e9ff", background: "#f5f5ff", panel: "#ffffff" },
  { label: "Copper", accent: "#b45309", wash: "#fdecd8", background: "#faf6f1", panel: "#ffffff" },
];

function userIndex(userId: string): number {
  const n = Number.parseInt(userId.replace(/^user_/, ""), 10);
  if (Number.isFinite(n) && n > 0) return n - 1;
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return h;
}

/** Stable unique theme for a user — same id always maps to the same palette. */
export function themeForUser(userId: string): UserTheme {
  const i = userIndex(userId) % PALETTES.length;
  const base = PALETTES[i]!;
  return { id: `theme-${i}`, ...base };
}

export function applyUserTheme(theme: UserTheme): void {
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--wash", theme.wash);
  root.style.setProperty("--panel", theme.panel);
  root.style.background = theme.background;
  root.setAttribute("data-user-theme", theme.id);
}

export function clearUserTheme(): void {
  const root = document.documentElement;
  root.style.removeProperty("--accent");
  root.style.removeProperty("--wash");
  root.style.removeProperty("--panel");
  root.style.background = "";
  root.removeAttribute("data-user-theme");
}
