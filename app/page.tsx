import Link from 'next/link';
import { runAssay, fmtTime, ASSAY_META } from '@/lib/assay';
import { PunchRow, MEANING } from '@/components/PunchRow';
import type { MarkId } from '@/lib/types';

export const revalidate = 1800;

const LEGEND: MarkId[] = ['ship', 'live', 'docs', 'open'];

export default async function Home() {
  const { builders, checkedAt, degraded, degradedReason } = await runAssay();

  const liveCount = builders.filter((b) => b.marks.some((m) => m.id === 'live' && m.state === 'struck')).length;
  const preview = builders.slice(0, 6);

  return (
    <div className="wrap">
      <section>
        {degraded && (
          <p className="banner" role="status">
            ⚠ {degradedReason ?? 'Source unreachable'} — the assay could not run. Nothing below is
            a judgement on any builder.
          </p>
        )}

        <p className="eyebrow">Summer Pilot 2026 · Independent assay</p>
        <h1 style={{ margin: '12px 0 16px', maxWidth: '15ch' }}>The cohort, independently assayed.</h1>
        <p className="lede">
          Every mark below is an automated check, run identically for all{' '}
          {builders.length || '—'} builders. The code that runs them is{' '}
          <Link href="/method">published</Link>. Nothing here is self-reported, and nothing here
          is an opinion about anyone&rsquo;s work.
        </p>

        <div style={{ marginTop: 'var(--s4)' }}>
          <PunchRow
            size="lg"
            caption="The four marks"
            marks={LEGEND.map((id) => ({ id, state: 'struck' as const, detail: MEANING[id] }))}
          />
        </div>

        <div className="stat-row">
          <div className="stat">
            <b>{builders.length || '—'}</b>
            <span>builders assayed</span>
          </div>
          <div className="stat">
            <b>{builders.length ? liveCount : '—'}</b>
            <span>deploys responding</span>
          </div>
          <div className="stat">
            <b className="mono" style={{ fontSize: '1.25rem', fontFamily: 'var(--evidence)' }}>
              {fmtTime(checkedAt)} ET
            </b>
            <span>last check</span>
          </div>
        </div>
      </section>

      <section>
        <h2>What a mark means</h2>
        <p className="lede" style={{ marginTop: 'var(--s2)' }}>
          A British hallmark is a row of punches struck by an assay office that has no stake in
          the sale. You read the row and trust the metal without re-testing it. Same idea here.
        </p>
        <table style={{ marginTop: 'var(--s4)' }}>
          <thead>
            <tr><th>Mark</th><th>Struck when</th></tr>
          </thead>
          <tbody>
            {LEGEND.map((id) => (
              <tr key={id}>
                <td className="mono" style={{ color: 'var(--mark)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{id}</td>
                <td>{MEANING[id]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: '0.9375rem', marginTop: 'var(--s3)', maxWidth: '62ch' }}>
          A hollow punch means <em>not yet</em>. A dashed punch means the check could not run —
          never that something failed. Checks re-run every{' '}
          {ASSAY_META.REVALIDATE / 60} minutes.
        </p>
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s3)', flexWrap: 'wrap' }}>
          <h2>The roster</h2>
          <Link href="/cohort" className="mono" style={{ color: 'var(--mark)' }}>
            all {builders.length || ''} builders →
          </Link>
        </div>

        {builders.length === 0 ? (
          <p className="lede" style={{ marginTop: 'var(--s3)' }}>
            The assay opens when the first submission merges. Until then there is nothing
            verified to show — and showing something anyway would defeat the point.
          </p>
        ) : (
          <div className="grid" style={{ marginTop: 'var(--s4)' }}>
            {preview.map((b) => (
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Hiring from this cohort?</h2>
        <p className="lede" style={{ marginTop: 'var(--s2)' }}>
          Start with what the marks do and do not tell you — then ask for an introduction to
          anyone whose work stands up.
        </p>
        <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s4)', flexWrap: 'wrap' }}>
          <Link className="btn" href="/partners">Request an introduction</Link>
          <Link className="btn ghost" href="/method">Read the standard</Link>
        </div>
      </section>
    </div>
  );
}
