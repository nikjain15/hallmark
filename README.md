# Hallmark

**The Summer Pilot 2026 cohort, independently assayed.**

🔗 **[hallmark-eta.vercel.app](https://hallmark-eta.vercel.app)**

---

## For partners

A British hallmark is a row of punches struck into silver by an assay office that has no stake
in the sale. You read the row and trust the metal without re-testing it yourself.

Thirty-two builders shipped up to three products each in three weeks. You do not have time to
open ninety repositories. Hallmark runs four checks on every one of them, identically, and
shows you the result:

| Mark | Struck when |
|---|---|
| **SHIP** | Submission pull request merged to the cohort branch |
| **LIVE** | Production URL responded successfully when last checked |
| **DOCS** | Build repo has a README of at least 500 bytes |
| **OPEN** | Build repo is public and readable |

A **hollow** punch means *not yet*. A **dashed** punch means *the check could not run* — never
that something is broken. That distinction is enforced in code ([`lib/assay.ts`](lib/assay.ts))
and it is the whole ethical basis of the product.

### What a mark does not mean

This is the part most showcases leave out, so it is the part we put first.

- **Not a quality score.** Nothing here reads anyone's code.
- **Not a ranking.** The roster is alphabetical and has no sort-by-score. Ranking peers who are
  also reviewing this project would be self-serving.
- **Not an endorsement.** Whether someone fits your team is your judgement, not ours.

### A suggested twenty minutes

1. Open the [roster](https://hallmark-eta.vercel.app/cohort) and scan for four struck marks.
2. Follow two or three live production links — they were responding when last checked.
3. Read each builder's positioning line, quoted verbatim from their own submission. We never
   paraphrase a peer.
4. [Ask for an introduction](https://hallmark-eta.vercel.app/partners).

---

## How it works

Nothing on this site is typed in by hand. Every claim is derived at build time from sources
neither we nor the builders control:

```
GitHub API ─┬─ merged submission PRs on projects/summer26/phase-1-project-{1,2,3}
            ├─ PR bodies → production URL, build repo, positioning line, sample pages
            └─ repo metadata → visibility, README size
                    │
                    ▼
            four checks, run identically per builder
                    │
                    ▼
            static pages, revalidated every 30 minutes
```

Because the evidence is fetched rather than authored, a builder cannot inflate their own row —
and neither can we.

- **Stack:** Next.js 16 (App Router, server components), TypeScript, zero client-side data JS.
- **Hosting:** Vercel. Incremental static regeneration, 30-minute revalidation.
- **The checker:** [`lib/assay.ts`](lib/assay.ts) — read it. A standard you cannot inspect is
  not a standard.
- **The parsers:** [`lib/parse.ts`](lib/parse.ts), covered by 13 unit tests in
  [`tests/parse.test.mjs`](tests/parse.test.mjs).

## Run it yourself

```bash
npm install
echo "GITHUB_TOKEN=$(gh auth token)" > .env.local   # read-only; avoids the 60 req/hr anon limit
npm run dev                                          # http://localhost:3210
npm test                                             # 13 parser tests
```

## Built with Build OS

Hallmark was built against [Build OS](https://nikjain15.github.io/build-os/) — a published
rubric of nine craft pillars. The full artifact set lives in [`docs/`](docs/), and this
project's own scorecard is in [`scorecard.json`](scorecard.json) and rendered publicly at
[/method](https://hallmark-eta.vercel.app/method), weak pillars included.

This build also produced the first draft of a proposed **10th artifact** for Build OS — a
graded low-fidelity visual spec written *before* any application code. See
[`docs/VISUAL.md`](docs/VISUAL.md) and its [wireframe](docs/wireframe.html). Every screen in
this site was drawn there first; the build was transcription.

---

Built by [@nikjain15](https://github.com/nikjain15) for the Hult Developer Program,
Summer Pilot 2026, Project 3. Marks are automated checks, not endorsements.
