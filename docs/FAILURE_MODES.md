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
