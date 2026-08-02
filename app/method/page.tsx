import Link from 'next/link';
import { ASSAY_META } from '@/lib/assay';
import { MEANING } from '@/components/PunchRow';
import scorecard from '@/scorecard.json';

export const metadata = { title: 'The standard' };

const CHECKS = [
  {
    id: 'ship',
    tests: 'A pull request titled “[Project N] Submission — handle” exists on the cohort repo and has a merge timestamp.',
    pass: 'GitHub reports a non-null merged_at.',
    falseNegative: 'A submission merged under an off-template title is not counted.',
  },
  {
    id: 'live',
    tests: 'The production URL from the PR body is requested like a browser would, following redirects.',
    pass: 'Any 2xx or 3xx status within 6 seconds.',
    falseNegative: 'A slow cold start, a geo-block, or a bot filter reads as “not checked”, never as broken.',
  },
  {
    id: 'docs',
    tests: 'The linked build repo is asked for its README via the GitHub API.',
    pass: 'A README exists and is at least 500 bytes.',
    falseNegative: 'Documentation living somewhere other than a root README is not seen.',
  },
  {
    id: 'open',
    tests: 'The linked build repo is fetched by slug.',
    pass: 'The repo resolves and is not private.',
    falseNegative: 'A repo under an org with restricted visibility reads as “not checked”.',
  },
];

export default function Method() {
  const pillars = Object.entries(scorecard.pillars) as [string, number | null][];

  return (
    <div className="wrap">
      <section>
        <p className="eyebrow">The standard</p>
        <h1 style={{ margin: '12px 0 16px' }}>What we check, and what we refuse to.</h1>
        <p className="lede">
          A standard you cannot inspect is not a standard. Every check is specified below,
          including the ways it can be wrong, and the code that runs it is in the open.
        </p>
      </section>

      <section>
        <h2>The four checks</h2>
        <table style={{ marginTop: 'var(--s4)' }}>
          <thead>
            <tr><th>Mark</th><th>What it tests</th><th>Passes when</th><th>Known false negative</th></tr>
          </thead>
          <tbody>
            {CHECKS.map((c) => (
              <tr key={c.id}>
                <td className="mono" style={{ color: 'var(--mark)', textTransform: 'uppercase' }}>{c.id}</td>
                <td>{c.tests}</td>
                <td>{c.pass}</td>
                <td className="muted">{c.falseNegative}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mono muted" style={{ marginTop: 'var(--s3)' }}>
          re-runs every {ASSAY_META.REVALIDATE / 60} min · timeout {ASSAY_META.PROBE_TIMEOUT_MS / 1000}s ·{' '}
          <a href="https://github.com/nikjain15/hallmark/blob/main/lib/assay.ts" style={{ color: 'var(--mark)' }}>
            read the checker ↗
          </a>
        </p>
      </section>

      <section>
        <h2>What a mark does not mean</h2>
        <p className="lede" style={{ marginTop: 'var(--s2)' }}>
          This is the part most showcases leave out, so it is the part we put in largest type.
        </p>
        <ul style={{ maxWidth: '62ch', lineHeight: 1.7 }}>
          <li><strong>Not a quality score.</strong> Nothing here reads anyone&rsquo;s code. Four struck marks mean four facts were true, not that the software is good.</li>
          <li><strong>Not a ranking.</strong> The roster is alphabetical and has no sort-by-score. Ranking peers who are also reviewing this project would be self-serving.</li>
          <li><strong>Not an endorsement.</strong> No one here is vouched for as a hire. That judgement is the partner&rsquo;s to make.</li>
          <li><strong>Not a failure notice.</strong> A hollow punch means “not yet”; a dashed punch means “we could not check”. Neither means broken.</li>
        </ul>
      </section>

      <section>
        <h2>We grade ourselves hardest</h2>
        <p className="lede" style={{ marginTop: 'var(--s2)' }}>
          Hallmark was built against{' '}
          <a href="https://nikjain15.github.io/build-os/">Build OS</a>, a published rubric of nine
          craft pillars. Here is this project&rsquo;s own scorecard, weak pillars included —
          publishing only the flattering half would make the rest of this page worthless.
        </p>
        <table style={{ marginTop: 'var(--s4)', maxWidth: '560px' }}>
          <thead><tr><th>Pillar</th><th style={{ textAlign: 'right' }}>Score</th></tr></thead>
          <tbody>
            {pillars.map(([name, score]) => (
              <tr key={name}>
                <td>{name}</td>
                <td className="mono" style={{ textAlign: 'right', color: score === null ? 'var(--ink-soft)' : score >= 8 ? 'var(--verified)' : score >= 6 ? 'var(--ink)' : 'var(--fault)' }}>
                  {score === null ? 'null' : `${score}/10`}
                </td>
              </tr>
            ))}
            <tr>
              <td><strong>Overall</strong></td>
              <td className="mono" style={{ textAlign: 'right' }}><strong>{scorecard.overall}/100</strong></td>
            </tr>
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: '0.9375rem', marginTop: 'var(--s3)', maxWidth: '62ch' }}>
          <strong>Weakest pillar:</strong> {scorecard.weakest_pillar}. {scorecard.next_focus}
        </p>
      </section>

      <section>
        <p><Link href="/partners" className="mono" style={{ color: 'var(--mark)' }}>partners: how to use this →</Link></p>
      </section>
    </div>
  );
}
