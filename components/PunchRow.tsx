import type { Mark, MarkId, Signal } from '@/lib/types';

const GLYPH: Record<MarkId, string> = { ship: '⬢', live: '◉', docs: '▤', open: '◈' };

/** What the punch means, in the words we also publish on /method. */
export const MEANING: Record<MarkId, string> = {
  ship: 'Submission pull request merged to the cohort branch',
  live: 'Production URL responded successfully when last checked',
  docs: 'Build repo has a README of at least 500 bytes',
  open: 'Build repo is public and readable',
};

/**
 * The hallmark row. Never colour-only: each punch carries a visible label and an aria-label
 * stating the fact that was verified, so the row is legible to screen readers and in
 * greyscale. `unknown` renders dashed with a `?` — never as a failure.
 */
export function PunchRow({
  marks,
  size = 'md',
  caption = 'Verification marks',
}: {
  marks: Mark[];
  size?: 'sm' | 'md' | 'lg';
  caption?: string;
}) {
  const cls = size === 'md' ? 'punch' : `punch ${size}`;
  return (
    <ul className="punches" aria-label={caption}>
      {marks.map((m) => (
        <li
          key={m.id}
          className={cls}
          data-state={m.state}
          title={m.detail}
          aria-label={`${m.id}: ${m.state === 'struck' ? 'verified' : m.state === 'unknown' ? 'not checked' : 'not yet'} — ${m.detail}`}
        >
          <span className="glyph" aria-hidden="true">
            {m.state === 'unknown' ? '?' : GLYPH[m.id]}
          </span>
          {m.id}
        </li>
      ))}
    </ul>
  );
}

/** The plain-English evidence list that sits under a certificate's punch row. */
export function MarkDetails({ marks }: { marks: Mark[] }) {
  return (
    <ul className="checklist">
      {marks.map((m) => (
        <li key={m.id}>
          <span className={m.state === 'struck' ? 'ok' : m.state === 'unknown' ? 'unk' : 'no'}>
            {m.state === 'struck' ? '✓' : m.state === 'unknown' ? '?' : '·'}
          </span>{' '}
          {m.detail}
        </li>
      ))}
    </ul>
  );
}

/**
 * The gap list — what to do about the marks that aren't struck.
 *
 * This is what stops a hollow punch being a dead end. The loop is check → gap → fix →
 * verified on the next run, and it needs no stored state because the remedy is computed
 * from the same fetch that produced the mark.
 */
export function GapList({ marks }: { marks: Mark[] }) {
  const gaps = marks.filter((m) => m.state !== 'struck' && m.remedy);
  if (gaps.length === 0) return null;

  return (
    <div className="gaps">
      <h3 style={{ fontSize: '1rem' }}>
        {gaps.length === 1 ? 'One mark left' : `${gaps.length} marks left`}
      </h3>
      <ol className="gap-list">
        {gaps.map((m) => (
          <li key={m.id}>
            <span className="gap-mark">{m.id}</span>
            <span>{m.remedy}</span>
          </li>
        ))}
      </ol>
      <p className="mono muted" style={{ fontSize: '0.6875rem', marginTop: 'var(--s2)' }}>
        checks re-run every 30 minutes — no need to tell us
      </p>
    </div>
  );
}

/**
 * Further signals — observations that are deliberately NOT marks.
 *
 * Scoring peers on these would judge 32 people against a bar invented after they submitted,
 * by someone competing alongside them. They appear on a builder's own certificate as context
 * and nowhere else. See docs/DECISION_LOG.md §Signals are not marks.
 */
export function Signals({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) return null;
  return (
    <div style={{ marginTop: 'var(--s4)' }}>
      <p className="eyebrow" style={{ color: 'var(--ink-soft)' }}>Further signals · not marks, not scored</p>
      <ul className="checklist" style={{ marginTop: 'var(--s2)' }}>
        {signals.map((s) => (
          <li key={s.id}>
            <span className={s.positive ? 'ok' : 'no'}>{s.positive ? '✓' : '·'}</span> {s.label}:{' '}
            {s.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
