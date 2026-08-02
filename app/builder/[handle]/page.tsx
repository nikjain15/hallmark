import Link from 'next/link';
import { notFound } from 'next/navigation';
import { runAssay, fmtDate, fmtTime } from '@/lib/assay';
import { PunchRow, MarkDetails } from '@/components/PunchRow';

export const revalidate = 1800;

export async function generateStaticParams() {
  const { builders } = await runAssay();
  return builders.map((b) => ({ handle: b.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return {
    title: `@${handle}`,
    description: `Verification marks and shipped work for @${handle} in the Summer Pilot 2026 cohort.`,
  };
}

export default async function Certificate({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { builders, checkedAt } = await runAssay();
  const builder = builders.find((b) => b.handle.toLowerCase() === handle.toLowerCase());

  if (!builder) notFound();

  const struck = builder.marks.filter((m) => m.state === 'struck').length;
  const pageUrl = `https://hallmark-eta.vercel.app/builder/${builder.handle}`;
  const shareText = `Assayed: ${struck}/4 marks struck on my Summer Pilot 2026 build.`;
  const shareX = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
  const shareLi = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;

  // The correction path. GitHub-native and pre-filled, so a peer can dispute a mark without
  // this site ever needing a form, a database, or an account — see ENGINEERING.md §Tracked
  // tech debt. Every mark's evidence is included so the report is actionable on arrival.
  const disputeBody = [
    `Page: ${pageUrl}`,
    '',
    'What the marks currently say:',
    ...builder.marks.map((m) => `- ${m.id}: ${m.state} — ${m.detail}`),
    '',
    'What is wrong, and what it should be:',
    '',
  ].join('\n');
  const disputeUrl =
    `https://github.com/nikjain15/hallmark/issues/new?title=${encodeURIComponent(`Mark correction: @${builder.handle}`)}` +
    `&body=${encodeURIComponent(disputeBody)}&labels=correction`;

  return (
    <div className="wrap">
      <section>
        <p className="eyebrow">Assayed · Summer Pilot 2026</p>
        <h1 style={{ margin: '12px 0 4px' }}>{builder.name}</h1>
        <p className="mono muted" style={{ margin: 0 }}>@{builder.handle}</p>

        <div style={{ marginTop: 'var(--s4)' }}>
          <PunchRow marks={builder.marks} size="lg" caption={`Verification marks for ${builder.handle}`} />
        </div>
        <div style={{ marginTop: 'var(--s3)', maxWidth: '62ch' }}>
          <MarkDetails marks={builder.marks} />
        </div>
        <p className="mono muted" style={{ marginTop: 'var(--s3)', fontSize: '0.6875rem' }}>
          marks reflect the most recent submission · last check {fmtTime(checkedAt)} ET ·{' '}
          <a href={disputeUrl} rel="noopener noreferrer" target="_blank" style={{ color: 'var(--mark)' }}>
            a mark wrong? tell us ↗
          </a>
        </p>

        {builder.ships[0]?.productionUrl && (
          <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s4)', flexWrap: 'wrap' }}>
            <a className="btn" href={builder.ships[0].productionUrl} rel="noopener noreferrer nofollow" target="_blank">
              Visit production ↗
            </a>
            {builder.ships[0].repoUrl && (
              <a className="btn ghost" href={builder.ships[0].repoUrl} rel="noopener noreferrer nofollow" target="_blank">
                View repo ↗
              </a>
            )}
          </div>
        )}
      </section>

      <section>
        <h2>Ships</h2>
        <p className="lede" style={{ marginTop: 'var(--s2)' }}>
          Every submission this builder merged, with exactly what each check found.
        </p>

        <div className="grid" style={{ marginTop: 'var(--s4)' }}>
          {builder.ships.map((s) => (
            <article key={s.prNumber} className="card">
              <p className="eyebrow">Project {s.project}</p>
              {s.oneLiner ? (
                <p style={{ margin: '8px 0 0', fontSize: '0.9375rem' }}>{s.oneLiner}</p>
              ) : (
                <p className="muted" style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>
                  No positioning line given in the submission.
                </p>
              )}

              <div style={{ marginTop: 'var(--s3)' }}>
                <PunchRow marks={s.marks} size="sm" caption={`Project ${s.project} marks`} />
              </div>
              <MarkDetails marks={s.marks} />

              <div className="mono" style={{ marginTop: 'var(--s3)', fontSize: '0.6875rem' }}>
                <a href={s.prUrl} rel="noopener noreferrer" target="_blank" style={{ color: 'var(--mark)' }}>
                  PR #{s.prNumber} ↗
                </a>{' '}
                · merged {fmtDate(s.mergedAt)}
              </div>

              {s.profileUrls.length > 0 && (
                <details style={{ marginTop: 'var(--s2)' }}>
                  <summary className="mono" style={{ fontSize: '0.6875rem', cursor: 'pointer', color: 'var(--ink-soft)' }}>
                    {s.profileUrls.length} sample page{s.profileUrls.length === 1 ? '' : 's'}
                  </summary>
                  <ul className="checklist">
                    {s.profileUrls.slice(0, 6).map((u) => (
                      <li key={u} style={{ wordBreak: 'break-all' }}>
                        <a href={u} rel="noopener noreferrer nofollow" target="_blank">{u}</a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Your card</h2>
        <p className="lede" style={{ marginTop: 'var(--s2)' }}>
          {struck === 4
            ? 'All four marks struck. This card is what appears when you post the link.'
            : `${struck} of 4 marks struck. Share it as it stands — a partial row is a record of where the work is, not a rejection.`}
        </p>

        <img
          src={`/builder/${builder.handle}/opengraph-image`}
          alt={`Hallmark certificate card for @${builder.handle}: ${struck} of 4 marks struck`}
          width={1200}
          height={630}
          style={{
            width: '100%', maxWidth: 620, height: 'auto', marginTop: 'var(--s4)',
            border: '1px solid var(--rule)', borderRadius: 3, display: 'block',
          }}
        />

        <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s3)', flexWrap: 'wrap' }}>
          <a className="btn" href={shareX} rel="noopener noreferrer" target="_blank">Post on X</a>
          <a className="btn ghost" href={shareLi} rel="noopener noreferrer" target="_blank">Share on LinkedIn</a>
          <a className="btn ghost" href={`/builder/${builder.handle}/opengraph-image`} download={`hallmark-${builder.handle}.png`}>
            Download card
          </a>
        </div>
      </section>

      <section>
        <p>
          <Link href="/cohort" className="mono" style={{ color: 'var(--mark)' }}>← back to the roster</Link>
        </p>
      </section>
    </div>
  );
}
