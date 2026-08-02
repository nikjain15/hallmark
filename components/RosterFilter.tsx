'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PunchRow } from './PunchRow';
import type { Builder, MarkId } from '@/lib/types';

const FILTERS: { id: MarkId | 'all'; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'live', label: 'live deploy' },
  { id: 'docs', label: 'has docs' },
  { id: 'open', label: 'public repo' },
];

/**
 * Roster search and filtering.
 *
 * The only client component in the app — everything else is server-rendered. Filters narrow
 * the list; there is deliberately no sort control, because the only sort orders worth
 * offering would rank peers against each other.
 */
export function RosterFilter({ builders }: { builders: Builder[] }) {
  const [query, setQuery] = useState('');
  const [mark, setMark] = useState<MarkId | 'all'>('all');
  const [project, setProject] = useState<number | 'all'>('all');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return builders.filter((b) => {
      if (q) {
        const hit =
          b.handle.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          b.ships.some((s) => s.oneLiner?.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (mark !== 'all' && !b.marks.some((m) => m.id === mark && m.state === 'struck')) return false;
      if (project !== 'all' && !b.ships.some((s) => s.project === project)) return false;
      return true;
    });
  }, [builders, query, mark, project]);

  return (
    <>
      <div className="filters">
        <label className="field" style={{ marginBottom: 0, flex: '1 1 260px' }}>
          <span className="visually-hidden">Search builders</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, handle, or what they built…"
            aria-label="Search builders by name, handle, or project description"
          />
        </label>

        <div className="chips" role="group" aria-label="Filter by mark">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip"
              aria-pressed={mark === f.id}
              onClick={() => setMark(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="chips" role="group" aria-label="Filter by project">
          {([1, 2, 3] as const).map((p) => (
            <button
              key={p}
              type="button"
              className="chip"
              aria-pressed={project === p}
              onClick={() => setProject(project === p ? 'all' : p)}
            >
              P{p}
            </button>
          ))}
        </div>
      </div>

      <p className="mono muted" aria-live="polite" style={{ marginTop: 'var(--s3)' }}>
        showing {shown.length} of {builders.length}
      </p>

      {shown.length === 0 ? (
        <p className="lede" style={{ marginTop: 'var(--s4)' }}>
          No builder matches that. Try clearing a filter — an empty result here means the filter
          is narrow, not that anyone is missing.
        </p>
      ) : (
        <div className="grid" style={{ marginTop: 'var(--s4)' }}>
          {shown.map((b) => (
            <Link key={b.handle} className="card" href={`/builder/${b.handle}`}>
              <strong className="serif" style={{ fontSize: '1.125rem' }}>{b.name}</strong>
              <div className="mono muted">@{b.handle}</div>
              {b.ships[0]?.oneLiner && (
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-soft)', margin: '8px 0 0' }}>
                  {b.ships[0].oneLiner}
                </p>
              )}
              <div className="card-foot">
                <PunchRow marks={b.marks} size="sm" caption={`Marks for ${b.handle}`} />
                <div className="mono muted" style={{ marginTop: 'var(--s2)', fontSize: '0.6875rem' }}>
                  {b.ships.length} ship{b.ships.length === 1 ? '' : 's'} ·{' '}
                  {b.ships.map((s) => `P${s.project}`).reverse().join(' ')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
