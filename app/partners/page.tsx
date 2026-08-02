import Link from 'next/link';
import { MEANING } from '@/components/PunchRow';
import type { MarkId } from '@/lib/types';

export const metadata = { title: 'For partners' };

const ORDER: MarkId[] = ['ship', 'live', 'docs', 'open'];

const INTRO_SUBJECT = encodeURIComponent('Hallmark — introduction request (Summer Pilot 2026)');
const INTRO_BODY = encodeURIComponent(
  [
    'Who I am:',
    'Organisation:',
    '',
    'Builders I would like to meet (handles from the roster):',
    '',
    'What I am looking for:',
    '',
    '— sent from hallmark',
  ].join('\n'),
);
const INTRO_MAILTO = `mailto:nikjain15@users.noreply.github.com?subject=${INTRO_SUBJECT}&body=${INTRO_BODY}`;

export default function Partners() {
  return (
    <div className="wrap">
      <section>
        <p className="eyebrow">For partners</p>
        <h1 style={{ margin: '12px 0 16px' }}>How to read the mark.</h1>
        <p className="lede">
          Fourteen builders shipped three products each in three weeks. You do not have time to
          open forty-two repositories. The marks tell you which claims have already been checked,
          so your time goes to judgement rather than verification.
        </p>
      </section>

      <section>
        <h2>What each punch guarantees</h2>
        <table style={{ marginTop: 'var(--s4)' }}>
          <thead><tr><th>Mark</th><th>Guarantee</th></tr></thead>
          <tbody>
            {ORDER.map((id) => (
              <tr key={id}>
                <td className="mono" style={{ color: 'var(--mark)', textTransform: 'uppercase' }}>{id}</td>
                <td>{MEANING[id]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>What it does not guarantee</h2>
        <p className="lede" style={{ marginTop: 'var(--s2)' }}>
          The marks are facts about artefacts, not assessments of people. Code quality,
          originality, and whether someone is right for your team are all still yours to judge —
          this page just removes the part a script can do better than you.
        </p>
        <p style={{ maxWidth: '62ch' }}>
          Read the <Link href="/method">full standard</Link>, including every way each check can
          return a wrong answer.
        </p>
      </section>

      <section>
        <h2>A suggested twenty minutes</h2>
        <ol style={{ maxWidth: '62ch', lineHeight: 1.8 }}>
          <li>Open the <Link href="/cohort">roster</Link> and filter by eye for four struck marks.</li>
          <li>Click through to two or three certificates and follow the live production links — they were responding when last checked.</li>
          <li>Read the builder&rsquo;s own positioning line, quoted verbatim from their submission. We do not paraphrase anyone.</li>
          <li>Ask for an introduction.</li>
        </ol>
      </section>

      <section>
        <h2>Request an introduction</h2>
        <p className="lede" style={{ marginTop: 'var(--s2)' }}>
          This opens a pre-filled email. It is deliberately not a form: a form here would collect
          your details into a database nobody is monitoring, and pretending otherwise would break
          the one promise this whole site makes.
        </p>
        <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s4)', flexWrap: 'wrap' }}>
          <a className="btn" href={INTRO_MAILTO}>Email for an introduction</a>
          <Link className="btn ghost" href="/cohort">Browse the roster</Link>
        </div>
      </section>
    </div>
  );
}
