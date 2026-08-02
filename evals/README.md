# Evals — Hallmark

Hallmark has no model in the loop, so per Build OS §8E the golden-set/judge questions (E1–E2)
swap to **the test pyramid**, and E4–E5 swap to **what actually gates a merge**.

## The pyramid, and what gates

| Layer | What it covers | Where | Gates a merge? |
|---|---|---|---|
| **Unit** | The 13 parser cases in `tests/parse.test.mjs` — every documented edge case from `ARCHITECTURE.md` §Edge cases | `npm test` | **Yes** — CI `verify` job |
| **Types** | Every consumer of `Mark`/`Ship`/`Builder`; a new `MarkState` is a compile error at each use site | `npx tsc --noEmit` | **Yes** |
| **Dependency** | Known CVEs at high or above | `npm audit --omit=dev --audit-level=high` | **Yes** |
| **Integration** | A full build runs the real assay against the live GitHub API and all 32 peers' deploys — a parsing or checking regression fails the build | `npm run build` | **Yes** |
| **End-to-end** | 23 cases against a live deployment: availability, the three-state invariant, alphabetical ordering, signal containment, the gap list, correction path, badge SVG, share-card PNG dimensions, API contract, published limits, freshness, a11y scaffolding | `npm run test:e2e` | **No** — runs against a deployment, so it gates *release*, not merge |

Every gating layer runs in `.github/workflows/ci.yml`, job `verify`, on every pull request to
`main`. This is a real gate, not a badge: it rejected `next@15.1.6` during the initial build,
which is why the project is on Next 16.

## Why the build is the integration test

There is no mock GitHub. `npm run build` fetches live PRs, parses 32 real human-written bodies,
and probes 32 real deploys. If a parser regresses, `generateStaticParams` produces the wrong
roster and the build output changes visibly. This is unusually strong for a static site and
unusually brittle in one specific way — see below.

## What the E2E suite is actually for

It does not merely check that pages load. It asserts the **product's ethical invariants** —
the properties that, if they broke, would misrepresent a peer:

- every mark is one of exactly three states, and each states its evidence
- the roster is alphabetical, never ordered by marks earned
- signals never appear on the roster, badge, share card, or API — only on a builder's own page
- an `unknown` mark reads as "not checked", never as failure
- no mark renders in the fault colour
- every certificate offers a correction path

These are the assertions worth having. A status-code smoke test would have passed happily
through the F7 outage; the roster assertion caught it in seconds.

## Known gaps, stated plainly

1. **E2E gates release, not merge.** It runs against a deployed URL, so it cannot block a PR the
   way the unit suite does. It is a post-deploy gate run by hand today.
2. **The integration test depends on a third party.** If GitHub is down or rate-limiting, the
   build fails for reasons unrelated to the change. We accept the false-positive rate rather
   than mock away the only real signal we have — and `FAILURE_MODES.md` §F7 is why that build
   failure is now the *correct* outcome rather than a nuisance.
3. **No golden set of PR bodies.** The 13 unit cases are hand-written from real bodies, not a
   versioned corpus sampled from all 32. A body shape nobody has written yet will not be caught.
   This is the highest-value thing to add next: snapshot all 32 live bodies into
   `evals/dataset/`, so parser changes are tested against reality rather than memory.
4. **No accessibility automation.** The suite checks that skip links and `aria-label`s exist; it
   does not run axe, and no screen reader has touched the site.

## The regression rule

Every production bug becomes a permanent unit test before the fix merges. Applied once so far:
the fabricated-latency bug (`responded 200 in 0ms`) — see `FAILURE_MODES.md` §F2. That one is
currently covered by removal of the code path rather than a test, which is weaker; noted here
rather than glossed.
