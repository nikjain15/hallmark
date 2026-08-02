import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hallmark-eta.vercel.app'),
  title: {
    default: 'Hallmark — the Summer Pilot 2026 cohort, independently assayed',
    template: '%s · Hallmark',
  },
  description:
    'An independent assay office for the Hult Developer Program Summer Pilot 2026 cohort. Every mark is an automated check, run identically for every builder, with the checking code published.',
  openGraph: {
    title: 'Hallmark — the cohort, independently assayed',
    description:
      'Four checks. Run the same way for everyone. Nothing self-reported.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="masthead">
          <div className="wrap">
            <Link className="brand" href="/">Hall<span>mark</span></Link>
            <nav aria-label="Primary">
              <Link href="/cohort">Roster</Link>
              <Link href="/method">Method</Link>
              <Link href="/partners">Partners</Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer>
          <div className="wrap">
            <p style={{ margin: 0, maxWidth: '62ch' }}>
              <strong>Hallmark</strong> is an independent assay of the Hult Developer Program
              Summer Pilot 2026 cohort, built by{' '}
              <a href="https://github.com/nikjain15">@nikjain15</a> for Project 3. Marks are
              automated checks, not endorsements — read{' '}
              <Link href="/method">what each one does and does not guarantee</Link>.
            </p>
            <p className="mono" style={{ marginTop: 'var(--s3)' }}>
              Built with Build OS · <a href="https://nikjain15.github.io/build-os/">the standard this was built against</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
