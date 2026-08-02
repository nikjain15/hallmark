import type { AssayResult, Builder, Mark, MarkState, Ship, Signal } from './types';
import { oneLiner, productionUrl, profileUrls, projectNumber, repoUrl } from './parse';

const COHORT_REPO = 'rogerSuperBuilderAlpha/hult-cohort-program';
const BRANCHES = [
  'projects/summer26/phase-1-project-1',
  'projects/summer26/phase-1-project-2',
  'projects/summer26/phase-1-project-3',
];

/** Checks are re-run at most this often. See docs/ARCHITECTURE.md §Performance budget. */
const REVALIDATE = 1800; // 30 min
const PROBE_TIMEOUT_MS = 6000;
const PROBE_CONCURRENCY = 6;

function gh(): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'hallmark-assay',
  };
  // Unauthenticated GitHub allows 60 req/hr, which this app exceeds on a cold build.
  // The token is read-only and public-repo scoped; it is never rendered or logged.
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function ghJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: gh(),
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Probe a URL the way a partner's browser would. Returns null when the check could not run. */
async function probe(url: string): Promise<{ ok: boolean; status: number; ms: number } | null> {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'hallmark-assay (cohort verification)' },
      next: { revalidate: REVALIDATE },
    });
    return { ok: res.status >= 200 && res.status < 400, status: res.status, ms: Date.now() - started };
  } catch {
    // Timeout, DNS failure, TLS error — all genuinely "we could not check", not "it is broken".
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Run `work` over `items` with bounded concurrency so we never stampede a peer's host. */
async function pooled<T, R>(items: T[], limit: number, work: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await work(items[i]);
      }
    }),
  );
  return out;
}

const mark = (id: Mark['id'], state: MarkState, detail: string, remedy: string | null = null): Mark => ({
  id,
  state,
  detail,
  remedy: state === 'struck' ? null : remedy,
});

/** Days after which a repo counts as unmaintained for the FRESH signal. */
const FRESH_DAYS = 14;

interface RawPr {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  merged_at: string | null;
  user: { login: string; avatar_url: string } | null;
}

/**
 * The four checks, run identically for every builder.
 *
 * Each returns `unknown` rather than `not-yet` when the check itself failed to execute.
 * The distinction is the whole ethical basis of the product.
 */
async function assayShip(pr: RawPr, project: number): Promise<Ship> {
  const body = pr.body ?? '';
  const prod = productionUrl(body);
  const repo = repoUrl(body);

  const ship = pr.merged_at
    ? mark('ship', 'struck', `Submission PR #${pr.number} merged ${fmtDate(pr.merged_at)}`)
    : mark(
        'ship',
        'not-yet',
        `Submission PR #${pr.number} is open, not yet merged`,
        'The cohort maintainer merges submission PRs. Make sure the title matches the template exactly and every required body section is filled.',
      );

  let live: Mark;
  if (!prod) {
    live = mark(
      'live',
      'not-yet',
      'No production URL given in the submission',
      'Add a "## Production URL" section to the submission PR body with the deployed link.',
    );
  } else {
    const r = await probe(prod);
    live = !r
      ? mark(
          'live',
          'unknown',
          `Could not reach ${host(prod)} within ${PROBE_TIMEOUT_MS / 1000}s — not checked`,
          `Nothing may be wrong. A cold start or a bot filter can exceed our ${PROBE_TIMEOUT_MS / 1000}s timeout. If ${host(prod)} loads for you, this will likely strike on the next check.`,
        )
      : r.ok
        ? mark('live', 'struck', `${host(prod)} responded ${r.status}`)
        : mark(
            'live',
            'not-yet',
            `${host(prod)} responded ${r.status}`,
            `The deploy is reachable but returned ${r.status}. Check the deployment logs, then re-check in 30 minutes.`,
          );
    // Deliberately no latency figure: probes are served from the fetch cache between
    // revalidations, so any duration we measured here would be the cache's, not the peer's.
    // Reporting it would be exactly the kind of unearned number this site exists to refuse.
  }

  let docs: Mark;
  let open: Mark;
  const signals: Signal[] = [];

  if (!repo) {
    const remedy = 'Link your build repo in the submission PR body, e.g. "Build repo: https://github.com/you/project".';
    docs = mark('docs', 'not-yet', 'No build repo linked in the submission', remedy);
    open = mark('open', 'not-yet', 'No build repo linked in the submission', remedy);
  } else {
    const slug = repo.replace('https://github.com/', '');
    const [meta, readme, workflows] = await Promise.all([
      ghJson<{ private: boolean; pushed_at: string; language: string | null }>(`/repos/${slug}`),
      ghJson<{ size: number }>(`/repos/${slug}/readme`),
      ghJson<Array<{ name: string }>>(`/repos/${slug}/contents/.github/workflows`),
    ]);

    open = !meta
      ? mark('open', 'unknown', `Could not read ${slug} — not checked`, 'If the repo is public, this will strike on the next check.')
      : meta.private
        ? mark('open', 'not-yet', `${slug} is private`, 'Make the repo public in Settings → General → Danger Zone → Change visibility.')
        : mark('open', 'struck', `${slug} is public, last pushed ${fmtDate(meta.pushed_at)}`);

    docs = !readme
      ? mark('docs', 'not-yet', `No README found in ${slug}`, 'Add a README.md at the repo root — what it does, how to run it, and who it is for.')
      : readme.size < 500
        ? mark(
            'docs',
            'not-yet',
            `README in ${slug} is ${readme.size} bytes, under the 500-byte bar`,
            `Your README is ${readme.size} bytes; ${500 - readme.size} more would strike this. A setup section and a one-paragraph "what this is" usually covers it.`,
          )
        : mark('docs', 'struck', `README in ${slug} is ${(readme.size / 1024).toFixed(1)}kb`);

    // Signals — context on the builder's own certificate only. Never scored, never ranked.
    if (Array.isArray(workflows)) {
      signals.push({
        id: 'tests',
        label: 'Continuous integration',
        value: `${workflows.length} workflow${workflows.length === 1 ? '' : 's'} in .github/workflows`,
        positive: true,
      });
    } else if (meta) {
      signals.push({ id: 'tests', label: 'Continuous integration', value: 'No workflows found', positive: false });
    }

    if (meta?.pushed_at) {
      const days = Math.floor((Date.now() - Date.parse(meta.pushed_at)) / 86_400_000);
      signals.push({
        id: 'fresh',
        label: 'Last activity',
        value: days <= 0 ? 'pushed today' : `pushed ${days} day${days === 1 ? '' : 's'} ago`,
        positive: days <= FRESH_DAYS,
      });
    }
  }

  return {
    project,
    prNumber: pr.number,
    prUrl: pr.html_url,
    mergedAt: pr.merged_at,
    title: pr.title,
    productionUrl: prod,
    repoUrl: repo,
    oneLiner: oneLiner(body),
    profileUrls: profileUrls(body),
    marks: [ship, live, docs, open],
    signals,
  };
}

/** Fetch every submission PR across all three project branches. */
async function fetchPrs(): Promise<RawPr[] | null> {
  const perBranch = await Promise.all(
    BRANCHES.map((b) =>
      ghJson<RawPr[]>(`/repos/${COHORT_REPO}/pulls?base=${encodeURIComponent(b)}&state=all&per_page=100`),
    ),
  );
  if (perBranch.every((r) => r === null)) return null; // GitHub is entirely unreachable
  return perBranch.flatMap((r) => r ?? []);
}

export async function runAssay(): Promise<AssayResult> {
  const checkedAt = new Date().toISOString();
  const prs = await fetchPrs();

  if (!prs) {
    return { builders: [], checkedAt, degraded: true, degradedReason: 'GitHub API unreachable' };
  }

  // One submission per builder per project — keep the most recently merged, since several
  // builders opened a corrected PR after their first merge.
  const best = new Map<string, RawPr & { project: number }>();
  for (const pr of prs) {
    const project = projectNumber(pr.title);
    if (!project || !pr.user || !/\[Project \d\]\s*Submission/i.test(pr.title)) continue;
    const key = `${pr.user.login.toLowerCase()}#${project}`;
    const prev = best.get(key);
    if (!prev || rank(pr) > rank(prev)) best.set(key, { ...pr, project });
  }

  const entries = [...best.values()];
  const ships = await pooled(entries, PROBE_CONCURRENCY, (pr) => assayShip(pr, pr.project));

  const byBuilder = new Map<string, Builder>();
  entries.forEach((pr, i) => {
    const login = pr.user!.login;
    const key = login.toLowerCase();
    if (!byBuilder.has(key)) {
      byBuilder.set(key, {
        handle: login,
        name: login,
        avatarUrl: pr.user!.avatar_url,
        ships: [],
        marks: [],
      });
    }
    byBuilder.get(key)!.ships.push(ships[i]);
  });

  const builders = [...byBuilder.values()].map((b) => {
    b.ships.sort((x, y) => y.project - x.project);
    return { ...b, marks: b.ships[0]?.marks ?? [] };
  });

  // Alphabetical, always. Sorting by marks earned would turn a verification tool into a
  // league table of our own peers — see docs/DECISION_LOG.md §Ranking.
  builders.sort((a, b) => a.handle.toLowerCase().localeCompare(b.handle.toLowerCase()));

  const degraded = builders.length === 0;
  return guardBuild({
    builders,
    checkedAt,
    degraded,
    degradedReason: degraded ? 'No submissions returned by GitHub' : null,
  });
}

/**
 * A degraded build must never replace a good deployment.
 *
 * The `degraded` state exists so that a *running* site can survive GitHub going down — it keeps
 * serving and says plainly that the assay could not run. That is correct at runtime and wrong
 * at build time: a build that cannot reach GitHub would otherwise generate a site with an empty
 * roster and ship it over a perfectly good one, replacing 32 real builders with a banner.
 *
 * This happened in production on 2026-08-02 (docs/FAILURE_MODES.md §F7). Throwing here fails the
 * build instead, and Vercel keeps the previous deployment live — the correct outcome, because
 * slightly stale truth beats fresh emptiness.
 */
function guardBuild(result: AssayResult): AssayResult {
  return result;
}

/**
 * Call from `generateStaticParams` — the one hook that runs *only* at build time.
 *
 * An earlier version of this guard keyed off `process.env.NEXT_PHASE`, which is set locally but
 * not reliably in Vercel's build container, so the guard silently did nothing exactly where it
 * was needed and a degraded build shipped anyway. Anchoring to a build-only call site removes
 * the environment guess entirely.
 */
export function assertNotDegraded(result: AssayResult): AssayResult {
  if (result.degraded) {
    throw new Error(
      `BUILD REFUSED: the assay is degraded (${result.degradedReason}). Building would ship an ` +
        `empty roster over a working deployment. The previous deploy stays live. ` +
        `Check GITHUB_TOKEN and the GitHub rate limit, then redeploy.`,
    );
  }
  return result;
}

const rank = (pr: RawPr) => (pr.merged_at ? Date.parse(pr.merged_at) : 0);
const host = (u: string) => {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
};

export function fmtDate(iso: string | null): string {
  if (!iso) return 'unknown';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const ASSAY_META = { REVALIDATE, PROBE_TIMEOUT_MS, BRANCHES, COHORT_REPO };
