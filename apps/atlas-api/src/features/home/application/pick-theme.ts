export type ThemeTokens = {
  name: string;
  accent: string;
  wash: string;
  panel: string;
  ink: string;
};

const THEMES: ThemeTokens[] = [
  { name: "ember", accent: "#f45100", wash: "#fff0e8", panel: "#ffffff", ink: "#030303" },
  { name: "lagoon", accent: "#0b7a75", wash: "#e6f4f3", panel: "#ffffff", ink: "#042f2e" },
  { name: "dusk", accent: "#5b3cc4", wash: "#efe8ff", panel: "#ffffff", ink: "#1a1040" },
  { name: "meadow", accent: "#2f7d32", wash: "#eaf5ea", panel: "#ffffff", ink: "#0f2e12" },
  { name: "slate", accent: "#334155", wash: "#eef2f6", panel: "#ffffff", ink: "#0f172a" },
];

export function pickTheme(): ThemeTokens {
  return THEMES[Math.floor(Math.random() * THEMES.length)]!;
}
