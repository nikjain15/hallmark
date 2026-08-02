/**
 * Parsers for cohort submission PR bodies.
 *
 * Pure functions, no network — this file is the unit-tested core (see tests/parse.test.mjs).
 * Submission bodies are written by 14 different people, so every parser here assumes the
 * shape is *approximately* the template and degrades to null rather than guessing.
 */

const COHORT_REPO = 'rogerSuperBuilderAlpha/hult-cohort-program';

/** Hosts that are never a builder's own production deploy. */
const NOT_PRODUCTION = ['github.com', 'www.github.com', 'gist.github.com'];

/** Extract every http(s) URL from a markdown blob, stripped of trailing punctuation. */
export function extractUrls(md: string): string[] {
  const raw = md.match(/https?:\/\/[^\s<>()[\]"']+/g) ?? [];
  return raw.map((u) => u.replace(/[.,;:]+$/, ''));
}

/** Pull the body of a markdown `## Section` by fuzzy heading match. */
export function section(md: string, heading: RegExp): string | null {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => /^#{1,4}\s/.test(l) && heading.test(l));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,4}\s/.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim() || null;
}

/**
 * The builder's own production URL.
 *
 * Deliberately conservative: we take it from the "Production URL" section when present, and
 * only fall back to a whole-body scan when that section is missing. A wrong production URL
 * would make the LIVE mark meaningless, so "none" beats "probably".
 */
export function productionUrl(md: string): string | null {
  const scoped = section(md, /production\s*url|live\s*url|deploy/i);
  const pool = extractUrls(scoped ?? md);
  const candidate = pool.find((u) => {
    try {
      return !NOT_PRODUCTION.includes(new URL(u).hostname);
    } catch {
      return false;
    }
  });
  return candidate ?? null;
}

/** The builder's own build repo — not the cohort repo, which every body links. */
export function repoUrl(md: string): string | null {
  const found = extractUrls(md).find((u) => {
    if (!u.includes('github.com')) return false;
    if (u.toLowerCase().includes(COHORT_REPO.toLowerCase())) return false;
    return /github\.com\/[^/]+\/[^/]+/.test(u);
  });
  if (!found) return null;
  const m = found.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  return m ? `https://github.com/${m[1]}/${m[2].replace(/\.git$/, '')}` : null;
}

/** Sample profile URLs the builder listed, deduped, production-host only. */
export function profileUrls(md: string): string[] {
  const scoped = section(md, /sample\s*profile|profile\s*urls?/i);
  if (!scoped) return [];
  const seen = new Set<string>();
  return extractUrls(scoped).filter((u) => {
    if (u.includes('github.com') || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

/**
 * The builder's own positioning line, in their words.
 *
 * We quote builders rather than describing them — writing our own summary of a peer's project
 * would be us editorialising about work we are also being reviewed alongside.
 */
export function oneLiner(md: string): string | null {
  const explicit = md.match(/\*\*One-?liner:?\*\*\s*(.+)/i);
  if (explicit) return clean(explicit[1]);

  const vibe = section(md, /vibe|positioning|pitch/i);
  if (vibe) {
    const line = vibe
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 25 && !l.startsWith('#') && !l.startsWith('|'));
    if (line) return clean(line);
  }
  return null;
}

function clean(s: string): string {
  const out = s
    .replace(/^\*\*[^*]*\*\*:?\s*/, '')
    .replace(/[*_`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
  return out.length > 200 ? `${out.slice(0, 197).trimEnd()}…` : out;
}

/** `[Project 3] Submission — handle` → 3. Returns null when the title is off-template. */
export function projectNumber(title: string): number | null {
  const m = title.match(/project\s*(\d)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 3 ? n : null;
}
