import type { Mark, MarkId } from '@/lib/types';

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
