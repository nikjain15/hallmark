# STAKEHOLDERS — Hallmark

Built solo under a same-day deadline, so this is a map of real parties with real stakes — not an
imagined org chart.

| Who | What they need | Decision they own | Risk |
|---|---|---|---|
| **The 32 cohort builders** | To not be misrepresented. Their name, face, and work appear here without them opting in. | Whether to accept how they're portrayed; removal on request | **The single biggest risk in the project.** A wrong mark is a public false claim about a named peer. |
| **Peer reviewers (the same 32)** | To judge this fairly during contest week | Our score | They may read "measurement" as "being graded by a classmate" and resent it |
| **Hiring partners** | To find people worth an hour, and to know what the marks don't cover | Whether to trust the mark | Overtrust — reading a struck row as an endorsement of code quality |
| **Program (Roger / Hult)** | A submission meeting the merge bar; nothing that embarrasses the program | Eligibility | Publishing something about cohort members the program didn't sanction |
| **Nik (builder/owner)** | A submission that stands out on a saturated axis | Everything above | Time — one day, no second attempt |

## The alignment risk that actually matters

**We publish claims about 32 people who never consented.** Everything rendered is already public
(GitHub handles, avatars, submissions made to a shared repo for exactly this purpose), so this
is legitimate — but "legitimate" is not the same as "harmless."

The mitigations are structural rather than promised:

1. **No rankings, ever.** Alphabetical only, no sort-by-score (`assay.ts`, with the reason in a
   code comment so it survives refactoring).
2. **Three-state marks.** "Could not check" is never rendered as failure (ADR-0002).
3. **We quote, never paraphrase.** A peer's positioning line appears in their own words or not
   at all — writing our own summary of a peer's project would be editorialising about people we
   are competing against.
4. **Published limits.** `/method` and `/partners` both state what a mark does *not* mean, in the
   same type size as what it does.
5. **Removal on request**, no account required.

## Sign-offs (SH5)

| Needed from | For | Status |
|---|---|---|
| Nik | Name, positioning, audience, game-layer depth | **Obtained** — see `PRD.md` provenance tags |
| Program | Merge bar compliance | Self-checkable: exact PR title, four required body sections, merged before 17:00 EDT |
| Cohort members | Consent to appear | **Not obtained, and not sought** — Nik's call `[builder]`, choosing "public data + removal on request" over opt-in-only or notify-then-publish. All content was submitted publicly to a shared cohort repo for exactly this audience; anyone can be removed instantly with no account. This is the defensible position, not the maximally cautious one — recorded so the trade is visible. |

## Pushback (CS1)

**Real pushback, from Nik, twice — both times correct and both times changed the build:**

**1. "How are you building without asking me questions like we framed in Build OS?"**
Steel-manned: I had converted an interactive protocol into a deliverables checklist and written
the PRD by inferring answers. The artifacts looked complete and were partly fabricated. *What
changed:* stopped building, ran the interview, rewrote the PRD from actual answers, and added
**answer-provenance tags** so the failure is visible in the artifact rather than invisible.
Harvested into `LEARNINGS.md` as four proposed framework changes.

**2. "This is for builders who want to share cool work in a fun, gamified way."**
This contradicted the sober partner-facing product that was already live. Steel-manned: the
builder is the person with the emotional moment — just shipped, wants to post — and a
verification tool that ignores them is correct but joyless. *What changed:* the hybrid. The
verification spine stayed; a playful layer went on top (collectible marks, shareable certificate
card). *What I pushed back on and Nik accepted:* no leaderboard. An assay office that ranks its
clients is not an assay office, and ranking peers who are also our reviewers is self-serving.
The game layer is capped at **earn and display, never compare**.

**Simulations not run:** design critique, security & privacy review, GTM readiness. Each would
likely open with a finding already listed as open in `UX.md`, `SAFETY.md`, and `PRD.md`
respectively. Not run for time, and named rather than quietly skipped.
