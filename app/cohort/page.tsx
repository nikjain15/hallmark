import { runAssay, fmtTime } from '@/lib/assay';
import { RosterFilter } from '@/components/RosterFilter';

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
          <RosterFilter builders={builders} />
        )}
      </section>
    </div>
  );
}
