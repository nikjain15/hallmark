# COST — Hallmark

## Cost to serve (S1 swap: what does one request cost?)

There is no model in the loop, so the cost lines are hosting, egress, and third-party API quota.

| Line | Usage | Cost |
|---|---|---|
| Vercel hosting | Hobby tier; 5 static routes + 1 dynamic (OG image) | **$0** |
| Bandwidth | ~110kB shared JS + ~190B/route HTML; OG cards 55kB each | **$0** at cohort scale (Hobby includes 100GB/mo) |
| GitHub API | ~100 calls per regeneration | **$0** (5,000/hr authenticated) |
| Outbound probes | 32 GETs per regeneration against peers' hosts | **$0** to us |
| Domain | none — using `hallmark.vercel.app` | **$0** |

**Marginal cost per page view: effectively zero**, because every page is static HTML served from
Vercel's edge. A viewer does not trigger a GitHub call, a probe, or a function invocation.

**The exception is the OG card**, which is a dynamic function invocation rendering a 1200×630
PNG. At Hobby limits (100k invocations/mo) this supports roughly 100,000 card renders — three
orders of magnitude above any plausible demand from a 32-person cohort.

## The real constraint is quota, not money

At this scale the binding limit is never dollars. It is the **GitHub API rate limit**:

- Unauthenticated: 60 req/hr → a single cold build (~100 calls) exceeds it. This is why the
  token is mandatory (ADR-0001 §Consequences).
- Authenticated: 5,000 req/hr → ~50 cold builds per hour available; we regenerate twice per hour.

**Headroom: ~50×.** The operating point is deliberate: 30-minute revalidation was chosen as the
slowest refresh that still feels live on a merge-deadline day, which keeps API usage at ~2% of
quota and leaves room for redeploys during active development.

## Cost of the checks themselves

The expensive operation is not compute, it is **other people's servers**. Each regeneration
sends 32 outbound GETs. Guards:

- Bounded concurrency (6) — we never hit 32 hosts simultaneously.
- 6-second timeout — we never hold a peer's connection open.
- Cached for 30 minutes — we probe each host at most twice an hour, not per visitor.

Without ISR, a viral link would have turned every pageview into 32 requests against classmates'
free-tier deploys. The static architecture is a courtesy cost control as much as a performance one.

## Unit economics (GEN3) `[builder]`

**This does not make money and is not intended to.** Nik's stated goal: win Week 3 and hold a
strong public artefact afterwards. Cost to serve one user is ~$0.00; revenue is $0.00.

Explicitly **not** positioned as the seed of a product for other cohorts — that option was on
the table and rejected. This matters for scope: it is why there is no multi-tenant abstraction,
no configurable check set, and no attempt to generalise beyond one repo's submission convention
(`PRD.md` §Segments). A one-week build honestly labelled as one.

**The real cost is time**, and it was spent as follows on build day: ~25 min on the lo-fi visual
spec, ~2h on the app, ~1h on framework correction and re-interview, ~1.5h on artifacts. The
lo-fi pass is the line item worth noting — 25 minutes that made the app build largely
transcription, which is the argument for the proposed 10th artifact.

**Break-even is not applicable.** If this outlived the contest, the first cost line to appear
would be a custom domain (~$12/yr), and the first genuine constraint would be GitHub quota if
the roster grew beyond a few hundred builders — at which point ISR would need to become a
scheduled job writing a cached snapshot, rather than per-build fetching. Logged as
revisit-at-200-builders.
