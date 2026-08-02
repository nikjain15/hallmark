# PRD — Hallmark

> **Answer provenance.** Every section below is tagged with who actually answered it:
> `[builder]` — Nik answered directly · `[assisted]` — Nik chose from options I framed ·
> `[agent-inferred]` — I wrote it; Nik has not confirmed it.
>
> This tagging exists because on this build I initially wrote the whole PRD by inferring the
> builder's answers, and nothing in the artifact revealed that. See `LEARNINGS.md` 2026-08-02
> and `DECISION_LOG.md` §Interview skipped. Per the proposed §2½(e), an `agent-inferred` answer
> caps its pillar at `good` and does not count toward §10 coverage.

## Problem

A cohort showcase is read by someone deciding whether to spend an hour on a stranger. The
standard format — a grid of cards, each with a name, a screenshot, and a self-written blurb —
gives that reader nothing they can act on, because every claim on it was written by the person
being assessed. The reader's real question is not "what did you build?" but "is any of this
actually there?", and no portfolio answers it.

**Users `[builder]`:** builders who are making genuinely cool things and want to talk about that
work in a way that is fun, engaging, and simple — without writing a humblebrag post.

**Also served `[assisted]`:** hiring partners evaluating the cohort. Nik chose the hybrid: the
verification spine stays (it is what makes any of this credible), and the surface gets playful
for builders. Explicitly **no peer rankings, no leaderboard** — the game layer stops at
collectible marks and a shareable card, because ranking peers who are also reviewing this
submission would be self-serving.

**The messy input that breaks v1 `[agent-inferred]`:** Nik named the audience but not a specific
breakage, so this is mine and unconfirmed — thirty-two submission PR bodies written by thirty-two
people to a template none of them followed exactly. Headings are renamed ("Live URL", "Deploy"),
production links appear in prose rather than under their heading, some bodies link five repos
and some link none, one links only the cohort repo, and at least one has a title that does not
match the template at all. A parser that assumes the template shape produces confidently wrong
evidence about a peer — which is worse than producing nothing.

## JTBD `[builder]`

> "When I've **just shipped or just been reviewed**, help me post it — quickly, without writing
> a humblebrag."

**Today they:** screenshot the app, write and rewrite a caption that tries to sound proud but
not boastful, and often never post at all because the writing is the friction.

Hallmark removes the writing. The card *is* the caption: four punches, a name, a live link. The
work speaks and the builder does not have to.

**Secondary JTBD `[assisted]`:** "When I'm handed a cohort of strangers, help me find the three
worth an hour." Same data, different reader.

## Segments

**First `[builder]`:** builders in the cohort, at the moment of shipping.

**Deliberately not yet `[agent-inferred]`:**
- *Builder-editable profiles.* Self-editing reintroduces the self-reporting the marks exist to
  remove. The playful layer is earned marks, never authored claims.
- *Leaderboards or peer rankings.* Ruled out by Nik directly `[builder]` — see §Differentiation.
- *The program's own assessment needs.* Grading is the program's job, not ours.
- *Anyone outside this cohort.* The checks are shaped around one repo's submission convention.

## Differentiation

Three of the fourteen Project 3 submissions merged before ours position on the word *proof*
("proof of work, not a portfolio", "puts cohort proof on display", "plates cohort proof").
Evidence-for-partners is the saturated axis in this field.

Hallmark's axis is **measurement**: not *that* someone shipped, but a published standard,
applied identically, whose failure modes are documented and whose checking code is linked from
the page. The differentiator is not the data — several peers pull the same PRs. It is that we
state what the checks cannot see, and refuse to rank.

**The hybrid `[builder]`.** On top of that spine sits a deliberately playful layer: marks are
*collectible*, and every builder gets a shareable certificate card. Nik chose this over both a
sober partner-only tool and a full gamified rebuild.

The tension is real and worth naming: gamification usually means points, streaks and
leaderboards, and a leaderboard would destroy the assay's credibility the moment it shipped —
an assay office that ranks its clients is not an assay office. So the game layer is capped at
**earn and display, never compare**. You collect your four punches; you are never placed above
or below a peer. That constraint is what lets both halves coexist.

## Quality bar

| Bar | Threshold |
|---|---|
| **Good enough to ship** `[agent-inferred]` | All four checks run against every merged submission; every mark traceable to a specific verified fact; all four UI states implemented; site responds under 1s. |
| **Delightful** `[agent-inferred]` | A builder can go from landing on their certificate to a posted card in one click; the punch row is legible in greyscale and to a screen reader; the honest-limits section is as prominent as the marks. |
| **Never ship below this** `[builder]` | **Any mark that misrepresents a peer.** A failed check rendered as a builder's failure, a fabricated metric, or a rank order of peers. Any one of these ships nothing. |

Nik set the floor directly, and it is the strictest of the options offered — stricter than
"site must be up" or "must look exceptional". That choice is load-bearing: it is why the code
has three mark states instead of two (ADR-0002), why the latency figure was deleted rather than
corrected (`FAILURE_MODES.md` §F2), and why there is no leaderboard.

The never-ship line is not rhetorical: during the build, the LIVE mark reported
`responded 200 in 0ms`. The figure came from the fetch cache, not the peer's server. It was a
fabricated number about someone else's work, so it was removed rather than rounded — see
`DECISION_LOG.md` §Fabricated latency.

## Metrics `[agent-inferred]`

- **Working:** builders posting their card. Given the JTBD ("just shipped, want to post it"),
  the action that proves the product worked is a share — not a pageview.
- **Also working:** partner click-through from a certificate to a live production URL.
- **Warning:** count of marks in `unknown` state. Rising `unknown` means the checker is
  degrading and the page is quietly becoming less truthful while looking identical.

## Instrumentation

Deliberately thin, and the reason is recorded rather than hidden. Hallmark stores no user data
and sets no analytics cookies (see `SAFETY.md` §Data handling), so the value metric above is
**not instrumented in v1**. Vercel's request logs give route-level traffic and nothing else.

This is a real gap: by Build OS D8, a metric you cannot measure is a wish. The honest position
is that we chose zero-tracking over measurable click-through for a site whose audience is
thirty-two peers and a handful of partners over one week, and logged the trade rather than
claiming instrumentation we do not have. Revisit if this outlives the contest.

The warning metric *is* measurable today: `unknown` counts are derivable from a single build
log line and visible on the page itself.

## Business case

See `COST.md`. Non-revenue by design: this is a contest submission and a portfolio artefact.
Cost to serve is effectively zero at cohort scale; the binding constraint is the GitHub API
rate limit, not money.

## Distribution `[builder]`

Single channel bet: **the cohort's own review week**. Thirty-two peers are required to open
every submission between Aug 2 and the review deadline — a captive, motivated audience with zero
acquisition cost that no launch post could buy.

**Evidence it can work:** the audience is not speculative. The requirement is published on the
program site ("file written reviews on every peer who merged a submission"), and 14 Project 3
submissions had already merged before ours. Reach is effectively guaranteed; only attention is
in question.

**The asset for that channel:** the honest-limits section on `/method` and `/partners`. It is
the thing a peer reading their tenth showcase of the day will find unusual enough to remark on.

**Channel works if:** peers reference the *standard* — the checks, the three-state marks, the
published limits — rather than the visuals, in their written reviews.

**Secondary loop, not the bet:** builders posting their own cards. This is the JTBD and it may
compound, but it depends on peers choosing to share, which we cannot assume. Treated as upside
rather than plan.

## Kill criteria `[builder]`

**Kill line:** a mark provably misrepresented someone, and the cause is design rather than a
fixable bug. A verification product that verifies wrongly has negative value — it is worse than
the portfolio dump it replaced, because it launders a false claim through an apparatus of
credibility.

Note this is the *same* standard as the never-ship bar, chosen independently. That consistency
is the point: the thing that would stop us shipping is the thing that would make us stop
entirely.

**Checked honestly at close of build:** no known misrepresentation. One near-miss caught and
fixed before it could mislead anyone (the fabricated latency figure, live for roughly 40
minutes). Continue.

**Deliberately not the kill line:** not placing in the contest. Nik ruled that out as a kill
criterion, which means the artefact is meant to stand on its own regardless of the result.
