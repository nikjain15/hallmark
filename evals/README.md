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
| **End-to-end** | Route smoke test (5 routes, status + latency) | manual `curl`, recorded in `ARCHITECTURE.md` §Performance budget | **No** — see gap below |

Every gating layer runs in `.github/workflows/ci.yml`, job `verify`, on every pull request to
`main`. This is a real gate, not a badge: it rejected `next@15.1.6` during the initial build,
which is why the project is on Next 16.

## Why the build is the integration test

There is no mock GitHub. `npm run build` fetches live PRs, parses 32 real human-written bodies,
and probes 32 real deploys. If a parser regresses, `generateStaticParams` produces the wrong
roster and the build output changes visibly. This is unusually strong for a static site and
unusually brittle in one specific way — see below.

## Known gaps, stated plainly

1. **No automated end-to-end test.** Route health is checked by hand. A rendering regression that
   still compiles would ship. Mitigated by the site being 5 routes; not mitigated in principle.
2. **The integration test depends on a third party.** If GitHub is down, CI fails for reasons
   unrelated to the change. We accept the false-positive rate at this scale rather than mock
   away the only real signal we have.
3. **No golden set of PR bodies.** The 13 unit cases are hand-written from real bodies, not a
   versioned corpus sampled from all 32. A body shape nobody has written yet will not be caught.
   This is the single highest-value thing to add next: snapshot all 32 live bodies into
   `evals/dataset/`, so parser changes are tested against reality rather than memory.

## The regression rule

Every production bug becomes a permanent unit test before the fix merges. Applied once so far:
the fabricated-latency bug (`responded 200 in 0ms`) — see `FAILURE_MODES.md` §F2. That one is
currently covered by removal of the code path rather than a test, which is weaker; noted here
rather than glossed.
