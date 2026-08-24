const MOODS = ["focused", "curious", "steady", "sparked", "calm"] as const;
export type Mood = (typeof MOODS)[number];

export function pickMood(seed = Date.now()): Mood {
  return MOODS[Math.abs(seed) % MOODS.length]!;
}
