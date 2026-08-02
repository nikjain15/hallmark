# ARCHITECTURE — Hallmark

## How it's built

```
                    ┌────────────────────────────────────────────┐
  build / ISR ─────▶│ runAssay()                lib/assay.ts     │
                    │                                            │
                    │  1. fetchPrs()   3 branches, state=all      │
                    │       │          GitHub REST, 30m cache     │
                    │       ▼                                     │
                    │  2. dedupe       one PR per builder×project │
                    │       │          keep latest merged         │
                    │       ▼                                     │
                    │  3. parse        lib/parse.ts (pure, tested)│
                    │       │          → prod URL, repo, one-liner│
                    │       ▼                                     │
                    │  4. check        pooled(6) probes:          │
                    │       │            · GET production URL     │
                    │       │            · GET /repos/{slug}      │
                    │       │            · GET /repos/{slug}/readme│
                    │       ▼                                     │
                    │  5. roll up      marks = latest ship's marks│
                    │                  sort A–Z, never by score   │
                    └───────────────────┬────────────────────────┘
                                        ▼
                        static HTML, revalidate 1800s
                                        ▼
                            Vercel edge → partner
```

There is no database, no runtime API, and no client-side data fetching. Every page is a server
component rendered at build time and regenerated every 30 minutes. The client bundle contains
no application logic — only React's own runtime.

## Big choices

See `adr/ADR-0001.md` (fetch-at-build vs. a database) and `adr/ADR-0002.md` (three-state marks
vs. boolean pass/fail).

## Edge cases (B1)

The ugliest inputs are thirty-two human-written PR bodies. Guards live in code, not in hope:

| Input | Guard |
|---|---|
| Heading renamed ("Live URL", "Deploy") | `section()` matches a regex family, not a literal string |
| Production URL only in prose | Falls back to a whole-body scan **only** when the section is absent |
| Body links the cohort repo and nothing else | `repoUrl()` explicitly excludes the cohort repo → `null`, mark reads "no build repo linked" |
| Deep link (`/blob/main/README.md`) or `.git` suffix | Normalised to `owner/repo` |
| Five profile URLs, or zero | Scoped to its section, deduped, capped at 6 in the UI |
| A 400-word "one-liner" | Truncated at 200 chars with an ellipsis |
| Title off-template (`Update README`) | `projectNumber()` → `null`, PR skipped entirely |
| Builder merged two PRs for one project | Deduped by `builder×project`, latest `merged_at` wins |
| Peer's site hangs | 6s `AbortController` timeout → `unknown`, never `failed` |

Every one of these is a unit test in `tests/parse.test.mjs`.

## Failure recovery (S5 swap: third-party down)

GitHub is the single critical dependency.

- **Partially down** (one branch 404s): the other branches still render. `fetchPrs()` returns
  `null` only when *every* branch fails.
- **Entirely down**: `runAssay()` returns `degraded: true` with an empty roster, and the page
  shows a banner stating the assay could not run and that nothing shown is a judgement on any
  builder. **We degrade to "we don't know", never to "they failed".**
- **A peer's host down**: that single mark becomes `unknown`. It never cascades.
- **Rate-limited**: `ghJson` returns `null` on any non-2xx, which flows to `unknown`. With the
  token present, the 5,000 req/hr ceiling is ~50× our per-build usage.

Because pages are statically generated, a GitHub outage during a revalidation window leaves the
last good page serving. The site cannot go down because a dependency did.

## Only-once actions (B4)

Not applicable in the usual sense: Hallmark has **no writes**. There is no mutating endpoint,
no payment, no send, no user-triggered state change. The entire application is a pure function
of public GitHub state. Idempotency is therefore structural rather than implemented — the same
inputs always produce the same page, and a re-run is indistinguishable from a first run.

This is the correct answer for this product, not a skipped question: the way to make double-fire
safe is to have nothing that fires.

## Observability (SH3)

- Vercel build logs record every assay run, including which checks returned `unknown`.
- `checkedAt` is rendered on the page itself — the site displays its own freshness, so a stale
  or failed regeneration is visible to any user, not just to us.
- **"It's broken" signal:** a rise in `unknown` marks. If a formerly-struck mark turns
  `unknown` across many builders at once, the checker (not the cohort) has regressed.

Honest limitation: there is no alerting. At this scale and lifespan the operator checks the
page. Logged in `DECISION_LOG.md` rather than dressed up.

## Performance budget (GEN1)

- **Target:** p95 under 1s for the key screen (`/cohort`, the heaviest page at 32 cards).
- **Enforcer:** the architecture, not a linter — pages are static HTML with no client data
  fetching, no images beyond avatars, and no web fonts (system serif/sans/mono stack).
- **Measured on production:** `/` 356ms, `/cohort` 323ms, `/method` 191ms, `/partners` 174ms,
  `/builder/artira` 244ms (cold, 2026-08-02).
- **Heaviest asset:** React's own runtime (~105kB shared JS). The application contributes
  187 B per route.

## Config changes (S8 swap)

Copy and check definitions live in version-controlled TypeScript, not a CMS. A change ships
through git → Vercel preview → production, and rolls back with `vercel rollback`. The check
thresholds (timeout, README minimum, revalidation window) are constants in `lib/assay.ts`
exported as `ASSAY_META` and **rendered on `/method`**, so the published standard cannot drift
from the code that enforces it.

## Migrations (GEN2)

No database, therefore no schema migrations. The "schema" is the `Mark`/`Ship`/`Builder`
interface in `lib/types.ts`; changing it is a TypeScript compile error at every use site, which
is a stronger guarantee than a migration script. If persistence is ever added, expand-then-
contract applies.

## Versioning

The published standard is versioned with the site. Any change to what a mark means is a change
to `/method` in the same commit as the code — they cannot diverge, because `/method` imports
its constants from the checker.
