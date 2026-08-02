import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap">
      <section>
        <p className="eyebrow">No record</p>
        <h1 style={{ margin: '12px 0 16px' }}>No submission on record.</h1>
        <p className="lede">
          Nobody by that handle has a merged submission on the cohort branches we check. That may
          simply mean their pull request has not merged yet — it is not a statement about anyone.
        </p>
        <p style={{ marginTop: 'var(--s4)' }}>
          <Link className="btn" href="/cohort">See the roster</Link>
        </p>
      </section>
    </div>
  );
}
