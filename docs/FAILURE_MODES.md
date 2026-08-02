# FAILURE MODES — Hallmark

E3 asks for hostile and malformed inputs, what broke, and the specific guardrail for each. Below
are the real ones found during this build, not hypotheticals.

## F1 — A peer's site is slow, and we call them broken

**The break.** The first version of the LIVE check was `try { fetch } catch { return false }`.
A free-tier deploy cold-starting past our timeout, a geo-block, or a bot filter all produced
identical output to a genuinely dead site: a failed mark next to a named peer's face.

**Severity.** P0. This is the product's worst possible failure — publishing a false negative
claim about an individual who is also one of our reviewers.

**Fix.** A third mark state (ADR-0002). `unknown` is returned whenever the check could not
execute, rendered dashed with `?` and labelled "not checked". It is never counted as a failure
and never shown in the fault colour.

**Guard.** Type-level: `MarkState = 'struck' | 'not-yet' | 'unknown'`. A lazy `catch → false`
is now a compile error at every call site rather than a judgement call.

---

## F2 — We fabricated a number about someone else's server

**The break.** LIVE reported `responded 200 in 0ms`. The figure came from `Date.now()` around a
`fetch` that Next served from its own cache between revalidations. It was not the peer's latency;
it was our cache's. Shipped to production and caught on review of the live page.

**Severity.** P0 by the PRD's never-ship bar — a fabricated metric about a peer's work.

**Fix.** The latency figure was removed rather than corrected. A truthful measurement is not
available through a cached fetch, and an approximate one is not worth the risk.

**Guard.** A comment at the site of the deletion explaining why it must not come back — the
failure mode here is a future contributor "helpfully" re-adding a metric that looks useful.

**Weakness, stated:** this is guarded by prose, not a test. Weaker than F1.

---

## F3 — Thirty-two people did not follow the template

**The break.** Parsing assumed the PR template. Reality: renamed headings ("Live URL", "Deploy"),
production URLs in prose rather than under their heading, bodies linking five repos or none, one
linking only the cohort repo, and titles that do not match the template at all.

**Severity.** P1. Produces confidently wrong evidence — worse than no evidence.

**Fixes and guards**, each covered by a unit test in `tests/parse.test.mjs`:

| Break | Guard |
|---|---|
| Renamed heading | `section()` matches a regex family, not a literal |
| URL only in prose | Whole-body fallback, but **only** when the section is absent |
| Cohort repo linked as if it were the build repo | Explicit exclusion → `null` → "no build repo linked" |
| Deep links, `.git` suffixes | Normalised to `owner/repo` |
| Off-template title | `projectNumber()` → `null`, PR skipped entirely |
| Two PRs for one project | Deduped by `builder×project`, latest merge wins |
| 400-word "one-liner" | Truncated at 200 chars |

**Principle applied throughout:** when the parser is unsure, it returns `null` and the UI says
"not given in the submission". It never guesses on a peer's behalf.

---

## F4 — A vulnerable dependency nearly shipped

**The break.** The initial build ran `next@15.1.6`, which carries a known CVE. Vercel refused
the deployment.

**Severity.** P1, and instructive: this was caught by someone else's guardrail, not ours.

**Fix.** Upgraded to Next 16 and React latest; added `overrides` forcing patched `postcss` and
`sharp`, which Next pins internally. `npm audit --omit=dev` now reports zero vulnerabilities.

**Guard.** `npm audit --omit=dev --audit-level=high` is now a merge-blocking CI step, so the
next one fails in a pull request rather than at the deploy boundary.

---

## F7 — A degraded build shipped over a good one

**The break.** A deploy ran while the GitHub token was rate-limited (a consequence of F6). The
assay returned `degraded: true` with zero builders, the build succeeded, and that empty site
replaced a working one in production. For several minutes `hallmark.vercel.app` showed a banner
where 32 builders had been.

**Severity.** P1 — total loss of the product's content, from a transient upstream condition.

**Why it happened.** The `degraded` state was designed for a *running* site: keep serving, say
plainly that the assay could not run, never fabricate. That is right at runtime and exactly
wrong at build time, where the same graceful path quietly produces an empty artefact and ships
it. One state, two contexts, opposite correct behaviours.

**How it was caught.** The end-to-end suite, minutes after it was written — the roster assertion
failed against production. Manual smoke tests had passed, because every route still returned
200. An empty site is perfectly healthy by status code.

**Fix.** `guardBuild()` in `lib/assay.ts` throws when the assay is degraded during
`phase-production-build`. The build fails, Vercel keeps the previous deployment, and stale truth
beats fresh emptiness.

**Guard.** The throw carries its own reasoning in the message and a doc comment explaining why
runtime and build time must diverge — the tempting refactor is to "handle it gracefully
everywhere", which reintroduces exactly this failure.

---

## F6 — The product exhausted its owner's GitHub quota

**The break.** `/badge/[handle]` shipped as a dynamic route. Every request ran the full assay —
~100 GitHub API calls. Badges are designed to live in other people's READMEs, where GitHub's
camo image proxy fetches them aggressively and on every page view. Combined with repeated
deploys (each also ~100 calls), this exhausted the deploy token's hourly quota and locked the
owner out of the GitHub API entirely, including `gh` on the command line.

**Severity.** P1, and the most interesting failure in the build because it only appears at the
intersection of two individually-reasonable decisions: "badges should be live" and "evidence is
fetched, never stored."

**Why it was invisible:** it does not fail. Nothing errors, nothing 500s, no test goes red. The
site keeps serving cached badges while, elsewhere, the owner's unrelated tooling starts
returning 403. The blast radius lands outside the product.

**Fix.** `generateStaticParams` on the badge route, so every known builder's badge is prebuilt
at deploy time and served as a static asset. Requests now cost zero API calls.

**Guard.** The route carries a comment explaining why it must not become dynamic again — the
tempting "simplification" is to delete `generateStaticParams`, which silently reintroduces the
failure.

**Remaining exposure, stated:** the deploy token is a *personal* token, so the site's build
still spends the owner's individual quota. The correct fix is a dedicated fine-grained token
with read-only public-repo access, so that exhausting it degrades this site and nothing else.
Recorded in `SAFETY.md` §Secrets and `COST.md` §The real constraint.

---

## F5 — Hostile and malformed input sweep

Five deliberately nasty inputs, run against the parsers:

| Input | Result |
|---|---|
| Body containing only the cohort repo link | `repoUrl → null`; DOCS and OPEN read "no build repo linked". Correct. |
| `https://` with no host | Discarded by the `new URL()` guard in `productionUrl`. Correct. |
| Markdown link with hostile label (`[safe.com](http://evil.example)`) | We resolve the **href**, never the label; all outbound links carry `rel="noopener noreferrer nofollow"` and `target="_blank"`. Correct. |
| 400-word one-liner with markdown injection | Stripped of `*_\`` and truncated; React escapes the rest. No raw HTML is ever rendered — there is no `dangerouslySetInnerHTML` anywhere in the codebase. |
| Empty PR body (`null`) | Coerced to `''`; every parser returns `null`; the builder still appears with an honest "not given" row. Correct. |

**Not covered:** a PR body crafted to make a *peer* look bad is out of scope, because we only
ever render a builder's own body on their own certificate. There is no cross-builder text path.

---

## Open

- No end-to-end test — a rendering regression that still compiles would ship (`evals/README.md`).
- No corpus of all 32 real bodies in `evals/dataset/` — parser tests are written from memory of
  real shapes, not from a versioned snapshot of them.
- F2's guard is a comment, not a test.
