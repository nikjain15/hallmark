import Link from 'next/link';
import { runAssay, fmtTime } from '@/lib/assay';
import { PunchRow } from '@/components/PunchRow';

export const revalidate = 1800;
export const metadata = { title: 'The roster' };

export default async function Roster() {
  const { builders, checkedAt, degraded, degradedReason } = await runAssay();

  return (
    <div className="wrap">
      <section>
        <p className="eyebrow">Summer Pilot 2026</p>
        <h1 style={{ margin: '12px 0 16px' }}>The roster</h1>

        {degraded && (
          <p className="banner" role="status">⚠ {degradedReason} — showing nothing rather than guessing.</p>
        )}

        <p className="lede">
          {builders.length || 'No'} builders, listed alphabetically. Never ranked: this is a
          verification tool, not a league table.
        </p>
        <p className="mono muted" style={{ marginTop: 'var(--s2)' }}>
          last check {fmtTime(checkedAt)} ET
        </p>

        {builders.length === 0 ? (
          <p className="lede" style={{ marginTop: 'var(--s4)' }}>
            No submissions have merged yet. When they do, each builder appears here with their
            four marks and a link to everything the checks looked at.
          </p>
        ) : (
          <div className="grid" style={{ marginTop: 'var(--s5)' }}>
            {builders.map((b) => (
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
      </section>
    </div>
  );
}
