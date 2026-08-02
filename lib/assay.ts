import type { AssayResult, Builder, Mark, MarkState, Ship } from './types';
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

const mark = (id: Mark['id'], state: MarkState, detail: string): Mark => ({ id, state, detail });

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
    : mark('ship', 'not-yet', `Submission PR #${pr.number} is open, not yet merged`);

  let live: Mark;
  if (!prod) {
    live = mark('live', 'not-yet', 'No production URL given in the submission');
  } else {
    const r = await probe(prod);
    live = !r
      ? mark('live', 'unknown', `Could not reach ${host(prod)} within ${PROBE_TIMEOUT_MS / 1000}s — not checked`)
      : r.ok
        ? mark('live', 'struck', `${host(prod)} responded ${r.status} in ${r.ms}ms`)
        : mark('live', 'not-yet', `${host(prod)} responded ${r.status}`);
  }

  let docs: Mark;
  let open: Mark;
  if (!repo) {
    docs = mark('docs', 'not-yet', 'No build repo linked in the submission');
    open = mark('open', 'not-yet', 'No build repo linked in the submission');
  } else {
    const slug = repo.replace('https://github.com/', '');
    const [meta, readme] = await Promise.all([
      ghJson<{ private: boolean; pushed_at: string }>(`/repos/${slug}`),
      ghJson<{ size: number }>(`/repos/${slug}/readme`),
    ]);
    open = !meta
      ? mark('open', 'unknown', `Could not read ${slug} — not checked`)
      : meta.private
        ? mark('open', 'not-yet', `${slug} is private`)
        : mark('open', 'struck', `${slug} is public, last pushed ${fmtDate(meta.pushed_at)}`);
    docs = !readme
      ? mark('docs', 'not-yet', `No README found in ${slug}`)
      : readme.size < 500
        ? mark('docs', 'not-yet', `README in ${slug} is under 500 bytes`)
        : mark('docs', 'struck', `README in ${slug} is ${(readme.size / 1024).toFixed(1)}kb`);
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
  return {
    builders,
    checkedAt,
    degraded,
    degradedReason: degraded ? 'No submissions returned by GitHub' : null,
  };
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
