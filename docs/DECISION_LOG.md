# DECISION LOG — Hallmark

## Assumptions (D4)

Unknowns we committed to rather than stalled on:

| Unknown | Assumption taken | Cheap check |
|---|---|---|
| Will peers find being checked by a classmate presumptuous? | They won't, **if** we never rank them and publish our limits as loudly as our marks | Whether written peer reviews mention the standard approvingly or resentfully |
| Do partners actually read a "what this doesn't mean" section? | Yes, and it builds rather than costs trust | Not measurable in one week; stated as a bet |
| Will builders share a card with fewer than four marks? | Yes, if the partial state reads as "in progress" rather than "rejected" — designed for explicitly in `wireframe-card.html` | Whether any sub-4 card gets posted |
| Is 30 minutes fresh enough on deadline day? | Yes, given `checkedAt` is displayed so staleness is never hidden | Complaints about missing submissions |

## Named decisions

### Name: Hallmark (from Proof)
Started as **Proof**. A scan of merged Project 3 submissions found three peers already leading
on that exact word — shiplog ("proof of work, not a portfolio"), banterfolio ("cohort proof"),
pixie dust cheesecake ("plates cohort proof") — and **Signal** was taken by signal-atlas. The
evidence-for-partners axis was saturated before we started. Moved to the *measurement* axis,
which nobody occupied. The assay-office metaphor then supplied the brand device (the punch row),
the tone, and the honesty constraints.

### Hybrid over pivot `[builder]`
Nik's D1 answer described a builder-facing, gamified product; what was live was a sober,
partner-facing verifier. Rather than pick one, we kept the verification spine and added a
playful surface (collectible marks, shareable certificate card).

**What was pushed back on and dropped: the leaderboard.** An assay office that ranks its clients
is not an assay office, and ranking peers who are simultaneously our reviewers is self-serving.
The game layer is capped at **earn and display, never compare**.

### Interview skipped, then rerun
The build began by treating Build OS `SKILL.md` as reference documentation and its artifact list
as a deliverables checklist — so PRD, ADRs and several docs were written by inferring the
builder's answers rather than asking. Nik caught it twice.

*What changed:* the interview was run properly, the PRD was rewritten from real answers, and
**answer-provenance tags** (`[builder]` / `[assisted]` / `[agent-inferred]`) were added so the
failure is visible in the artifact instead of invisible. Four framework fixes were harvested
into the hub's `LEARNINGS.md`, including `interview_ran` in the scorecard and a §0 Step 0 time-box.

This is logged as a decision, not just a mistake, because the remaining `[agent-inferred]` tags
are a deliberate choice: leaving them honestly marked beats fabricating agreement.

### Scope cuts (B3)

| Cut | Why |
|---|---|
| Builder-editable profiles | Reintroduces self-reporting (ADR-0001) |
| Auth / GitHub sign-in | No account needed for a read-only site; adds PII and retention duties for zero user benefit |
| A real intro form | Would collect partner details into a database nobody monitors. `mailto:` instead — no write path, no stored PII, and the page says so plainly |
| Leaderboards, points, streaks | See Hybrid above |
| Custom fonts in the OG card | Satori needs font binaries; the marks were redrawn as CSS shapes instead, removing the dependency entirely (`FAILURE_MODES.md` §F2 sibling) |
| §9 stakeholder simulations | Time. Named as not-run in `UX.md`, `SAFETY.md`, `STAKEHOLDERS.md` rather than quietly skipped |

### Fabricated latency
The LIVE mark shipped reading `responded 200 in 0ms`. The number came from Next's fetch cache,
not the peer's server — a fabricated metric about someone else's work, which is precisely the
PRD's never-ship line. **Removed rather than corrected**, because no truthful measurement is
available through a cached fetch and an approximate one is not worth the risk. Live for ~40
minutes. Full write-up in `FAILURE_MODES.md` §F2.

### Ranking: never
`assay.ts` sorts alphabetically, with the reason in a code comment so it survives refactoring.
There is no sort-by-score anywhere in the product. This is the constraint that lets a
competitive submission also be a fair one.

### Consent stance `[builder]`
Thirty-two peers appear without opting in. Position taken: **public data plus removal on
request** — everything rendered was submitted publicly to a shared cohort repo for exactly this
audience. Opt-in-only was considered and rejected (the roster would be empty and the product
could not demonstrate); notify-then-publish was considered and rejected for time.

This is the defensible position rather than the maximally cautious one, and it is recorded so
the trade is visible rather than assumed. Mitigations in `STAKEHOLDERS.md` §Alignment risk.

### Next 15 → 16 mid-build
Vercel refused the first production deploy: `next@15.1.6` carries a known CVE. Upgraded to Next
16 and React latest, plus `overrides` for `postcss` and `sharp` which Next pins internally. Cost
~15 minutes and one stale-cache build failure. `npm audit` now reports zero, and the audit is a
merge-blocking CI step so the next one fails in a PR rather than at the deploy boundary.

## Skips logged (Build OS Step 4)

- **SH7 (over-refusal):** n/a — no model in the loop. §8E permits the skip; logged rather than
  silently dropped.
- **B4 (idempotency):** structurally satisfied — there is no write path anywhere, so there is
  nothing to fire twice. Reasoned in `ARCHITECTURE.md` §Only-once actions rather than ticked.
- **D8 (instrumentation):** deliberately not instrumented. Zero-tracking was chosen over a
  measurable click-through metric; the gap is stated in `PRD.md` §Instrumentation rather than
  papered over.
