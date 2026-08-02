import { runAssay, ASSAY_META } from '@/lib/assay';
import { MEANING } from '@/components/PunchRow';

export const revalidate = 1800;

/**
 * The whole assay as JSON.
 *
 * Public and CORS-open on purpose: the standard is published, so the data behind it should be
 * too. Anyone — including a peer building their own showcase — can consume this rather than
 * re-scraping the cohort repo.
 */
export async function GET() {
  const { builders, checkedAt, degraded, degradedReason } = await runAssay();

  return Response.json(
    {
      standard: {
        marks: MEANING,
        states: {
          struck: 'The fact was verified.',
          'not-yet': 'The check ran and the fact was not true.',
          unknown: 'The check could not run. This is not a failure.',
        },
        revalidateSeconds: ASSAY_META.REVALIDATE,
        probeTimeoutMs: ASSAY_META.PROBE_TIMEOUT_MS,
        branches: ASSAY_META.BRANCHES,
        sourceRepo: ASSAY_META.COHORT_REPO,
        checker: 'https://github.com/nikjain15/hallmark/blob/main/lib/assay.ts',
        notes:
          'Marks are automated checks, not endorsements. There is no ranking: builders are ordered alphabetically. Signals are context on a builder’s own page and are deliberately excluded from this feed so nobody can score peers on a bar invented after they submitted.',
      },
      checkedAt,
      degraded,
      degradedReason,
      count: builders.length,
      builders: builders.map((b) => ({
        handle: b.handle,
        name: b.name,
        avatarUrl: b.avatarUrl,
        url: `https://hallmark.vercel.app/builder/${b.handle}`,
        badge: `https://hallmark.vercel.app/badge/${b.handle}`,
        marks: b.marks.map(({ id, state, detail }) => ({ id, state, detail })),
        ships: b.ships.map((s) => ({
          project: s.project,
          prNumber: s.prNumber,
          prUrl: s.prUrl,
          mergedAt: s.mergedAt,
          productionUrl: s.productionUrl,
          repoUrl: s.repoUrl,
          oneLiner: s.oneLiner,
          marks: s.marks.map(({ id, state, detail }) => ({ id, state, detail })),
        })),
      })),
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    },
  );
}
