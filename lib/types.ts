/** A single punch in the hallmark row. */
export type MarkId = 'ship' | 'live' | 'docs' | 'open';

/**
 * The three outcomes a check can have.
 *
 * `unknown` is load-bearing: it means the check could not run (network error, rate limit,
 * timeout). It must never be rendered as a failure. Conflating "we could not reach it" with
 * "it is broken" would misrepresent a peer's work, which is this product's worst failure mode.
 * See docs/FAILURE_MODES.md §F1.
 */
export type MarkState = 'struck' | 'not-yet' | 'unknown';

export interface Mark {
  id: MarkId;
  state: MarkState;
  /** Plain-English statement of what was actually verified, shown to users and screen readers. */
  detail: string;
}

export interface Ship {
  /** 1 | 2 | 3 — which cohort project this submission was for. */
  project: number;
  prNumber: number;
  prUrl: string;
  mergedAt: string | null;
  title: string;
  /** Parsed out of the PR body. Any of these may legitimately be absent. */
  productionUrl: string | null;
  repoUrl: string | null;
  oneLiner: string | null;
  profileUrls: string[];
  marks: Mark[];
}

export interface Builder {
  handle: string;
  /** GitHub display name when set; we fall back to the handle rather than inventing one. */
  name: string;
  avatarUrl: string;
  ships: Ship[];
  /** Roll-up across all ships: a mark is struck if struck on the builder's latest ship. */
  marks: Mark[];
}

export interface AssayResult {
  builders: Builder[];
  /** When the checks actually ran. Rendered verbatim; never "just now". */
  checkedAt: string;
  /** True when we served cached/degraded data because a source was unreachable. */
  degraded: boolean;
  degradedReason: string | null;
}
