import { runAssay } from '@/lib/assay';
import type { MarkId } from '@/lib/types';

export const revalidate = 1800;

/**
 * Prebuild a badge for every known builder.
 *
 * Without this the route is dynamic, and every badge request runs the full assay — roughly
 * 100 GitHub API calls. Badges live in READMEs behind GitHub's image proxy, which fetches
 * them aggressively, so a dynamic badge would burn the deploy token's entire hourly quota
 * and lock the owner out of the GitHub API. It did exactly that during the build.
 * See docs/FAILURE_MODES.md §F6.
 */
export async function generateStaticParams() {
  const { builders } = await runAssay();
  return builders.map((b) => ({ handle: b.handle }));
}

/** An unknown handle still renders (all-hollow), it just isn't prebuilt. */
export const dynamicParams = true;

const ORDER: MarkId[] = ['ship', 'live', 'docs', 'open'];

const INK = '#16130F';
const MARK = '#8A6A1F';
const RULE = '#D9D1C4';
const PAPER = '#FAF7F2';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * An embeddable marks badge, for a builder's own README.
 *
 * ```md
 * [![Hallmark](https://hallmark.vercel.app/badge/you)](https://hallmark.vercel.app/builder/you)
 * ```
 *
 * Only the four published marks appear — never signals, never a rank, and never a number
 * that could be read as a score.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { builders } = await runAssay();
  const builder = builders.find((b) => b.handle.toLowerCase() === handle.toLowerCase());

  const marks = ORDER.map((id) => builder?.marks.find((m) => m.id === id));
  const label = 'hallmark';
  const labelW = 74;
  const cell = 42;
  const width = labelW + cell * 4;
  const height = 20;

  const cells = marks
    .map((m, i) => {
      const x = labelW + i * cell;
      const struck = m?.state === 'struck';
      const unknown = m?.state === 'unknown';
      const fg = struck ? PAPER : '#8C7A4E';
      const bg = struck ? MARK : 'transparent';
      const text = unknown ? '?' : ORDER[i];
      return `
  <rect x="${x}" y="0" width="${cell}" height="${height}" fill="${bg}"/>
  <line x1="${x}" y1="3" x2="${x}" y2="${height - 3}" stroke="${RULE}" stroke-width="1"/>
  <text x="${x + cell / 2}" y="14" fill="${fg}" text-anchor="middle"
        font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="9"
        letter-spacing="0.5">${text}</text>`;
    })
    .join('');

  const struckCount = marks.filter((m) => m?.state === 'struck').length;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
     role="img" aria-label="${esc(label)}: ${struckCount} of 4 marks struck for ${esc(handle)}">
  <title>${esc(handle)} — ${struckCount} of 4 Hallmark marks struck</title>
  <rect width="${width}" height="${height}" rx="3" fill="${PAPER}" stroke="${RULE}"/>
  <rect x="0" y="0" width="${labelW}" height="${height}" fill="${INK}"/>
  <text x="${labelW / 2}" y="14" fill="${PAPER}" text-anchor="middle"
        font-family="Georgia,serif" font-size="11" font-weight="600">${esc(label)}</text>${cells}
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Shorter than the assay window so a freshly-struck mark shows up quickly in a README,
      // while still keeping GitHub's camo proxy from hammering us.
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=1800',
    },
  });
}
