import { describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';

const SKILL_PATH = resolve(import.meta.dir, 'SKILL.md');
const TAXONOMY_PATH = resolve(import.meta.dir, 'references/taxonomy.md');
const EXPECTED_TOOL_COUNT = 1;

interface ManifestEntry {
  name: string;
  server: string;
}

const loadSkillText = (): Promise<string> => Bun.file(SKILL_PATH).text();

function extractManifest(text: string): ManifestEntry[] {
  const match = text.match(
    /"SKILL_EXPECTED_TOOL_MANIFEST"\s*:\s*(\[[\s\S]*?\n\s*\])/
  );
  if (!match || !match[1])
    throw new Error('SKILL_EXPECTED_TOOL_MANIFEST not found');
  return JSON.parse(match[1]) as ManifestEntry[];
}

function proseToolRefs(text: string): string[] {
  const re = /mcp__[a-z0-9-]+__([a-z0-9_]+)/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[1]!);
  return out;
}

describe('feedback SKILL.md', () => {
  test('exists and is non-empty', async () => {
    expect((await loadSkillText()).length).toBeGreaterThan(0);
  });

  test('manifest parses to its actual tool count and every entry is well-formed', async () => {
    const entries = extractManifest(await loadSkillText());
    expect(entries).toHaveLength(EXPECTED_TOOL_COUNT);
    for (const e of entries) {
      expect(typeof e.name).toBe('string');
      expect(e.server).toBe('rollout-server');
    }
  });

  test('every prose tool reference is in the manifest', async () => {
    const text = await loadSkillText();
    const names = new Set(extractManifest(text).map((e) => e.name));
    for (const ref of proseToolRefs(text)) expect(names.has(ref)).toBe(true);
  });

  // The distinguishing rule of this skill: broken auth is evidence, not a stop.
  test('Step 0 degrades instead of PARKing on unbound or unauthenticated repos', async () => {
    const text = await loadSkillText();
    expect(text).toMatch(/does NOT PARK|never PARK/i);
    expect(text).toContain('ensure_auth');
    expect(text).toMatch(/record .*as evidence/i);
  });

  test('the upload is gated on an explicit user confirmation', async () => {
    const text = await loadSkillText();
    expect(text).toContain('--dry-run');
    expect(text).toMatch(/AskUserQuestion/);
    expect(text).toMatch(/never upload|do not upload|nothing has left/i);
  });

  test('remarks are mandatory and the category is proposed, not demanded', async () => {
    const text = await loadSkillText();
    expect(text).toMatch(/remarks are mandatory|mandatory free-text/i);
    expect(text).toContain('references/taxonomy.md');
  });

  test('the taxonomy reference exists and lists categories with keys', async () => {
    const taxonomy = await Bun.file(TAXONOMY_PATH).text();
    expect(taxonomy).toContain('rollout-stuck');
    expect(taxonomy).toContain('uncategorised');
  });
});
