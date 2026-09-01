from __future__ import annotations

import random
from typing import TypedDict


class ThemeTokens(TypedDict):
    name: str
    accent: str
    wash: str
    panel: str
    ink: str


_THEMES: list[ThemeTokens] = [
    {"name": "ember", "accent": "#f45100", "wash": "#fff0e8", "panel": "#ffffff", "ink": "#030303"},
    {"name": "lagoon", "accent": "#0b7a75", "wash": "#e6f4f3", "panel": "#ffffff", "ink": "#042f2e"},
    {"name": "dusk", "accent": "#5b3cc4", "wash": "#efe8ff", "panel": "#ffffff", "ink": "#1a1040"},
    {"name": "meadow", "accent": "#2f7d32", "wash": "#eaf5ea", "panel": "#ffffff", "ink": "#0f2e12"},
    {"name": "slate", "accent": "#334155", "wash": "#eef2f6", "panel": "#ffffff", "ink": "#0f172a"},
]


def pick_theme() -> ThemeTokens:
    return random.choice(_THEMES)
