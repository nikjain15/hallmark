# ENGINEERING — Hallmark

## Layout

```
app/                      routes; every page is a server component
  page.tsx                the assay (home)
  cohort/                 roster
  builder/[handle]/       certificate, not-found, opengraph-image (the share card)
  method/  partners/      the published standard; partner guidance
  globals.css             design tokens transcribed from docs/VISUAL.md
components/PunchRow.tsx   the brand device + evidence list
lib/
  types.ts                Mark / Ship / Builder / AssayResult
  parse.ts                pure parsers — no network, unit-tested
  assay.ts                fetch + the four checks + roll-up
tests/parse.test.mjs      13 unit tests
evals/README.md           the test pyramid and what gates a merge
```

The split that matters is `parse.ts` (pure, tested, no I/O) versus `assay.ts` (all network). All
the logic that can be wrong in an interesting way lives in the pure half, which is why 13 unit
tests cover the risk despite there being no end-to-end suite.

## Testing (B2)

Exact-answer logic — URL extraction, section matching, dedup, truncation, title parsing — has
unit tests. There is no fuzzy/model output to evaluate, so per §8E the eval swap is the test
pyramid; the full gate table is in [`evals/README.md`](../evals/README.md).

## CI gate

`.github/workflows/ci.yml`, job `verify`, on every PR to `main`:

1. `npm test` — 13 parser tests
2. `npx tsc --noEmit` — typecheck
3. `npm audit --omit=dev --audit-level=high` — dependency CVEs
4. `npm run build` — runs the real assay against live GitHub and 32 live deploys

This is a real gate rather than a badge. It has already fired once in anger: the audit step is
why this project runs Next 16 instead of the 15.1.6 it was scaffolded with.

## Maintainability

- **Typed throughout.** `MarkState` is a union, so adding a state is a compile error at every
  use site rather than a silent fallthrough. This is the main defence protecting ADR-0002's
  three-state invariant from being flattened back to a boolean by a future edit.
- **Comments explain *why*, not *what*.** The load-bearing ones are the alphabetical-sort
  comment in `assay.ts` and the deleted-latency comment — both guard decisions that a
  well-meaning contributor would otherwise reverse.
- **Dependencies:** three runtime (`next`, `react`, `react-dom`), zero UI or utility libraries.
  No CSS framework — tokens are plain custom properties transcribed from `VISUAL.md`.
- **No client-side application JavaScript.** Every page is a server component; the only client
  bundle is React's own runtime.

## Tracked tech debt `[builder]`

**Accepted debt: there is no way for a peer to dispute a mark.**

Hallmark publishes claims about 32 named people. If a check gets one wrong, that person's only
recourse is opening an issue on this repo — there is nothing in the product itself that lets
them flag it, and most of them will never see the repo.

*Why it was accepted:* the alternatives all require a write path — a form, a database, or auth —
and every one of those reintroduces the self-reporting the marks exist to remove (ADR-0001).
Building a dispute channel that is itself verifiable is a genuine design problem, not an
afternoon's work, and the deadline was the same day.

*Why it is the right one to own in writing:* of the four shortcuts taken, this is the only one
whose cost lands on someone other than us. The others (no e2e tests, no parser corpus, 30-minute
staleness) cost us maintenance risk. This one costs a peer their accuracy of representation.

*Partially addressed during the build.* Every certificate now carries **"a mark wrong? tell
us"**, opening a pre-filled GitHub issue with the page URL and all four marks' current state and
evidence. Two clicks, no form, no account, no stored data — the correction channel obeys the
architecture rather than punching a hole in it.

*What remains debt after that fix:* it is a report channel, not a resolution loop. No SLA, no
status for the reporter, and a systematic mis-parse still needs a code change by us. A peer who
never opens their own certificate never sees the link. The honest framing is that the cost to a
misrepresented peer went from "find the repo yourself" to "two clicks" — real, but not resolved.

*Other mitigations already in place:* every mark states the exact evidence it was struck from and
links the PR it came from; removal on request requires no account; and the parsers return `null`
rather than guessing whenever they are unsure.

*The full fix, when it comes:* not builder-editable profiles — a builder-submitted correction
that is itself verifiable, e.g. a PR against this repo, so the provenance chain stays intact.

## Other known debt (not the accepted one, listed for honesty)

- No automated end-to-end test — a rendering regression that still compiles would ship.
- Parser tests written from real body shapes rather than a versioned corpus of all 32.
- `FAILURE_MODES.md` §F2 is guarded by a comment rather than a test.
- No screen-reader or automated accessibility pass (`UX.md` §Accessibility).
