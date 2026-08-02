/**
 * End-to-end tests against a running Hallmark deployment.
 *
 * Closes the gap recorded in docs/ENGINEERING.md §Tracked tech debt — until now route health
 * was checked by hand, so a rendering regression that still compiled would ship.
 *
 *   npm run test:e2e                      # against production
 *   BASE=http://localhost:3210 npm run test:e2e
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = (process.env.BASE ?? 'https://hallmark.vercel.app').replace(/\/$/, '');
const TIMEOUT = 20_000;

/**
 * React's server renderer inserts `<!-- -->` between an expression and adjacent text, so
 * `{score}/100` arrives as `89<!-- -->/100`. Stripping the markers lets assertions match what
 * a human actually reads on the page.
 */
const clean = (html) => html.replace(/<!-- -->/g, '');

async function get(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(TIMEOUT), ...opts });
  return { res, body: opts.method === 'HEAD' ? '' : clean(await res.text()) };
}

/**
 * Fetch the roster once, memoised as a single in-flight promise so concurrent tests share
 * one request instead of racing several.
 */
let apiPromise;
function assay() {
  apiPromise ??= (async () => {
    const r = await fetch(`${BASE}/api/assay`, { signal: AbortSignal.timeout(TIMEOUT) });
    assert.equal(r.status, 200, 'the API must be reachable for the suite to mean anything');
    const json = await r.json();
    assert.ok(
      Array.isArray(json.builders) && json.builders.length > 0,
      `the API returned an empty roster (degraded: ${json.degraded}, reason: ${json.degradedReason}) — every downstream assertion would be vacuous`,
    );
    return json;
  })();
  return apiPromise;
}

// ---------------------------------------------------------------- availability

for (const path of ['/', '/cohort', '/method', '/partners']) {
  test(`${path} responds 200 with HTML`, async () => {
    const { res, body } = await get(path);
    assert.equal(res.status, 200, `${path} should be 200`);
    assert.match(res.headers.get('content-type') ?? '', /text\/html/);
    assert.ok(body.includes('Hall'), 'brand should render');
  });
}

test('a real builder certificate renders', async () => {
  const { builders } = await assay();
  const handle = builders[0].handle;
  const { res, body } = await get(`/builder/${handle}`);
  assert.equal(res.status, 200);
  assert.ok(body.includes(handle), 'handle should appear on their own page');
});

test('an unknown handle 404s with the honest empty state', async () => {
  const { res, body } = await get('/builder/definitely-not-a-cohort-member-xyz');
  assert.equal(res.status, 404);
  assert.ok(
    body.includes('No submission on record'),
    'must explain rather than show a bare 404',
  );
  assert.ok(
    body.includes('not a statement about anyone'),
    'must not imply the person failed at anything',
  );
});

// ---------------------------------------------------------------- the standard

test('every mark on every builder is one of the three valid states', async () => {
  const { builders } = await assay();
  const valid = new Set(['struck', 'not-yet', 'unknown']);
  for (const b of builders) {
    assert.equal(b.marks.length, 4, `${b.handle} should carry exactly the four published marks`);
    for (const m of b.marks) {
      assert.ok(valid.has(m.state), `${b.handle}/${m.id} had invalid state "${m.state}"`);
      assert.ok(m.detail && m.detail.length > 0, `${b.handle}/${m.id} must state its evidence`);
    }
  }
});

test('the roster is alphabetical — never ranked by marks', async () => {
  const { builders } = await assay();
  const handles = builders.map((b) => b.handle.toLowerCase());
  const sorted = [...handles].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(handles, sorted, 'roster order must be alphabetical, not by score');
});

test('signals never leak into any comparable surface', async () => {
  const raw = JSON.stringify(await assay());
  assert.ok(!raw.includes('"signals"'), 'the public API must not expose signals');

  const { builders } = await assay();
  const { body: roster } = await get('/cohort');
  assert.ok(!roster.includes('Further signals'), 'roster must not show signals');
  const { body: badge } = await get(`/badge/${builders[0].handle}`);
  assert.ok(!/continuous integration/i.test(badge), 'badge must not show signals');
});

test('no mark is ever rendered in the fault colour', async () => {
  const { builders } = await assay();
  const withGap = builders.find((b) => b.marks.some((m) => m.state !== 'struck'));
  if (!withGap) return; // everyone is fully struck; nothing to assert
  const { body } = await get(`/builder/${withGap.handle}`);
  assert.ok(!body.includes('--fault'), 'a not-yet or unknown mark must not use the fault colour');
});

test('unknown marks are described as "not checked", never as failed', async () => {
  const { builders } = await assay();
  const unknown = builders.find((b) => b.marks.some((m) => m.state === 'unknown'));
  if (!unknown) return;
  const { body } = await get(`/builder/${unknown.handle}`);
  assert.ok(
    body.includes('not checked') || body.includes('Could not'),
    'an unknown mark must read as not-checked',
  );
});

// ---------------------------------------------------------------- the loop

test('an unstruck mark carries an actionable remedy', async () => {
  const { builders } = await assay();
  const withGap = builders.find((b) => b.marks.filter((m) => m.state !== 'struck').length > 0);
  if (!withGap) return;
  const { body } = await get(`/builder/${withGap.handle}`);
  assert.ok(/marks? left/.test(body), 'the gap list should render');
  assert.ok(body.includes('checks re-run every'), 'should tell them it re-checks itself');
});

test('every certificate offers a correction path', async () => {
  const { builders } = await assay();
  const { body } = await get(`/builder/${builders[0].handle}`);
  assert.ok(body.includes('a mark wrong'), 'correction affordance must be present');
  assert.ok(body.includes('github.com/nikjain15/hallmark/issues/new'), 'should be GitHub-native');
});

// ---------------------------------------------------------------- distribution

test('the badge is a valid SVG with an accessible name', async () => {
  const { builders } = await assay();
  const { res, body } = await get(`/badge/${builders[0].handle}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /image\/svg\+xml/);
  assert.ok(body.trimStart().startsWith('<svg'), 'should be an SVG document');
  assert.ok(body.includes('role="img"') && body.includes('aria-label'), 'must be accessible');
  assert.ok(body.includes('<title>'), 'must have a title for hover and screen readers');
});

test('the share card is a 1200x630 PNG', async () => {
  const { builders } = await assay();
  const res = await fetch(`${BASE}/builder/${builders[0].handle}/opengraph-image`, {
    signal: AbortSignal.timeout(TIMEOUT),
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /image\/png/);
  const buf = Buffer.from(await res.arrayBuffer());
  assert.ok(buf.length > 5000, 'card should not be a stub');
  // PNG IHDR: width and height are big-endian uint32 at bytes 16 and 20.
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
});

test('the API publishes the standard alongside the data', async () => {
  const { res } = await get('/api/assay');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), '*', 'should be CORS-open');

  const data = await assay();
  assert.ok(data.count > 0, 'should report a real roster');
  assert.equal(data.count, data.builders.length);
  assert.ok(data.standard?.marks?.ship, 'the standard must ship with the data');
  assert.ok(data.standard.checker.includes('assay.ts'), 'must link the checking code');
  assert.ok(data.checkedAt, 'must timestamp the check');
});

// ---------------------------------------------------------------- honesty

test('the site publishes what a mark does NOT mean', async () => {
  const { body } = await get('/method');
  assert.ok(body.includes('does not mean'), '/method must state the limits');
  assert.ok(body.includes('Not a ranking'), 'must disclaim ranking');
  assert.ok(body.includes('false negative') || body.includes('Known false negative'));
});

test('our own scorecard is published, weak pillars included', async () => {
  const { body } = await get('/method');
  assert.ok(/\d+\/100/.test(body), 'overall score must be rendered');
  assert.ok(body.includes('Weakest pillar'), 'must name our weakest pillar');
});

test('every page displays the freshness of its own data', async () => {
  for (const path of ['/', '/cohort']) {
    const { body } = await get(path);
    assert.ok(/last check/i.test(body), `${path} must show when checks last ran`);
  }
});

// ---------------------------------------------------------------- hygiene

test('no page leaks a stale domain or an unrendered value', async () => {
  const { builders } = await assay();
  const paths = ['/', '/cohort', '/method', '/partners', `/builder/${builders[0].handle}`];
  for (const p of paths) {
    const { body } = await get(p);

    // Strip <script> blocks first. React's flight payload legitimately contains `$undefined`
    // markers that no user ever sees; asserting against raw HTML flags them as bugs.
    const visible = body.replace(/<script[\s\S]*?<\/script>/gi, '');

    assert.ok(!visible.includes('hallmark-eta'), `${p} still references the old domain`);
    assert.ok(!visible.includes('undefined'), `${p} rendered "undefined" in visible markup`);
    assert.ok(!visible.includes('NaN'), `${p} rendered "NaN"`);
    assert.ok(!visible.includes('[object Object]'), `${p} rendered a raw object`);
  }
});

test('outbound links to peer sites are safely attributed', async () => {
  const { builders } = await assay();
  const withProd = builders.find((b) => b.ships.some((s) => s.productionUrl));
  const { body } = await get(`/builder/${withProd.handle}`);
  const externals = body.match(/<a[^>]+target="_blank"[^>]*>/g) ?? [];
  assert.ok(externals.length > 0, 'certificate should link out');
  for (const a of externals) {
    assert.ok(a.includes('noopener'), `external link missing noopener: ${a.slice(0, 90)}`);
  }
});

test('accessibility scaffolding is present on every page', async () => {
  for (const path of ['/', '/cohort', '/method', '/partners']) {
    const { body } = await get(path);
    assert.ok(body.includes('Skip to content'), `${path} needs a skip link`);
    assert.ok(body.includes('lang="en"'), `${path} needs a language`);
  }
});

test('marks are never colour-only — each carries an accessible label', async () => {
  const { builders } = await assay();
  const { body } = await get(`/builder/${builders[0].handle}`);
  for (const id of ['ship', 'live', 'docs', 'open']) {
    assert.ok(
      body.includes(`aria-label="${id}:`),
      `${id} punch must state its verified fact to a screen reader`,
    );
  }
});
