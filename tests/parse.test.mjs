import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractUrls, section, productionUrl, repoUrl, profileUrls, oneLiner, projectNumber,
} from '../lib/parse.ts';

// A real submission body, trimmed. Parsers must survive 14 different people's formatting.
const REAL = `# Project 3 Submission — @someone

## Production URL

https://example-app.vercel.app

Build repo: https://github.com/someone/example-app

## Sample profile URLs

- https://example-app.vercel.app/cohort/someone
- https://example-app.vercel.app/partners

## Vibe / positioning notes

**One-liner:** Proof of work, not a portfolio.

**Tone:** terminal / GitHub-native.
`;

test('extractUrls strips trailing punctuation', () => {
  assert.deepEqual(extractUrls('see https://a.com/x, and https://b.com.'), [
    'https://a.com/x', 'https://b.com',
  ]);
});

test('section pulls a fuzzy-matched heading body', () => {
  assert.match(section(REAL, /production\s*url/i) ?? '', /example-app\.vercel\.app/);
  assert.equal(section(REAL, /nonexistent heading/i), null);
});

test('productionUrl prefers the scoped section and skips github', () => {
  assert.equal(productionUrl(REAL), 'https://example-app.vercel.app');
});

test('productionUrl returns null rather than guessing when there is no candidate', () => {
  assert.equal(productionUrl('# Submission\n\nSee https://github.com/a/b only.'), null);
});

test('repoUrl finds the build repo and excludes the cohort repo', () => {
  assert.equal(repoUrl(REAL), 'https://github.com/someone/example-app');
  const cohortOnly = 'Target: https://github.com/rogerSuperBuilderAlpha/hult-cohort-program/pull/1';
  assert.equal(repoUrl(cohortOnly), null);
});

test('repoUrl normalises deep links and .git suffixes', () => {
  assert.equal(
    repoUrl('https://github.com/a/b.git and https://github.com/a/b/blob/main/README.md'),
    'https://github.com/a/b',
  );
});

test('profileUrls dedupes and drops github links', () => {
  const got = profileUrls(REAL);
  assert.equal(got.length, 2);
  assert.ok(got.every((u) => !u.includes('github.com')));
});

test('profileUrls is empty when the section is missing, not a whole-body scan', () => {
  assert.deepEqual(profileUrls('# Submission\n\nhttps://a.com'), []);
});

test('oneLiner prefers the explicit label and strips markdown', () => {
  assert.equal(oneLiner(REAL), 'Proof of work, not a portfolio.');
});

test('oneLiner falls back to the first substantial line of the vibe section', () => {
  const body = '## Vibe / positioning notes\n\nA warm, evidence-first showcase for hiring partners.';
  assert.equal(oneLiner(body), 'A warm, evidence-first showcase for hiring partners.');
});

test('oneLiner returns null when there is nothing to quote', () => {
  assert.equal(oneLiner('# Submission\n\n## Production URL\n\nhttps://a.com'), null);
});

test('oneLiner truncates runaway lines', () => {
  const long = `**One-liner:** ${'x'.repeat(400)}`;
  const got = oneLiner(long);
  assert.ok(got && got.length <= 200, 'should cap at 200 chars');
  assert.ok(got.endsWith('…'));
});

test('projectNumber parses the template title and rejects off-range', () => {
  assert.equal(projectNumber('[Project 3] Submission — nikjain15'), 3);
  assert.equal(projectNumber('[Project 9] Submission — x'), null);
  assert.equal(projectNumber('Update README'), null);
});
