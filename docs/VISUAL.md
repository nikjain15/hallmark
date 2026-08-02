# VISUAL — Hallmark (lo-fi spec)

> Proposed Build OS 10th artifact (candidate `V1`, pillar: UX/UI & Interaction).
> Written **before** any app code so that building is transcription, not invention.
> Companion wireframe: [`wireframe.html`](./wireframe.html)

---

## The device

A British silver **hallmark** is a row of small punched marks stamped by an independent assay
office. Each punch means one verified fact — maker, purity, office, date. A buyer reads the row
and trusts the metal without re-testing it.

Hallmark stamps the same way. Four punches, each an objective check, run identically for
every builder:

```
┌────┐┌────┐┌────┐┌────┐
│SHIP││LIVE││DOCS││OPEN│
└────┘└────┘└────┘└────┘
  ▲     ▲     ▲     ▲
  │     │     │     └── repo is public and reachable
  │     │     └──────── README exists and is non-trivial
  │     └────────────── production URL responds 2xx right now
  └──────────────────── submission PR merged to the cohort branch
```

The row **is** the brand. It appears on the home hero, on every roster card, and full-size on
each builder certificate. Nothing else in the field looks like this.

**Struck vs unstruck.** An earned punch is filled and solid. An unearned punch is an empty
outline — never red, never an X. We report absence, not judgement: the roster is still filling
today, and an unstruck mark most often means "not yet," not "failed."

---

## Color roles (tokens, not hex-by-vibe)

| Role | Purpose | Lo-fi value |
|---|---|---|
| `--paper` | page ground | warm off-white `#FAF7F2` |
| `--ink` | primary text | near-black `#16130F` |
| `--ink-soft` | secondary text | `#5C554B` |
| `--rule` | hairlines, punch outlines | `#D9D1C4` |
| `--mark` | the struck punch, accents | brass `#8A6A1F` |
| `--verified` | check passed | `#2F6B3A` |
| `--pending` | check not yet earned | `#8C7A4E` |
| `--fault` | check ran and failed | `#8C3A2E` (used sparingly, never on "not yet") |

Dark theme flips `paper`/`ink`; `--mark` lightens to `#D8B45A` to hold AA contrast.
Every pairing must pass **WCAG AA (4.5:1)** for body text, 3:1 for large text and punch outlines.

## Type scale

| Token | Use | Face |
|---|---|---|
| `--display` | hero, certificate name | serif — assay-office authority |
| `--body` | prose | sans |
| `--evidence` | URLs, check output, timestamps, handles | mono — everything machine-verified renders in mono |

Rule: **if a human wrote it, it's serif or sans. If a machine verified it, it's mono.** The
typography itself tells you which claims are checked.

Scale: 48 / 32 / 24 / 18 / 16 / 13. Line-height 1.5 body, 1.15 display.

## Layout

12-column grid, 1120px max, 24px gutter. Mobile: single column, 16px margin, punch row wraps
to 4-across at 40px. Spacing scale 4/8/16/24/40/64.

---

## Screens

1. **`/` — The assay.** Hero states the standard in one sentence + the punch row legend. Live
   counts (builders assayed, deploys responding, last check run). Roster preview. Method teaser.
   Partner CTA.
2. **`/cohort` — The roster.** Grid of builder cards, each with name, handle, one-line, punch
   row. Filterable by mark earned. Sort is alphabetical by default — *never* by score.
3. **`/builder/[handle]` — The certificate.** Full punch row struck large. Their ships across
   P1/P2/P3, each with production link, repo, what each check found, and when it last ran.
4. **`/partners` — How to read the mark.** What each punch guarantees, what it does not, and
   the intro CTA.
5. **`/method` — The published standard.** Exactly what each check tests, in plain English,
   with a link to the code that runs it. Our own Build OS scorecard, in full, including the
   weak pillars.

## The four states, per screen

| Screen | Empty | Loading | Error | Success |
|---|---|---|---|---|
| Home | "Assay opens when the first submission merges" + method link | Skeleton punch row, counts as `—` | Stale banner: "Showing last good check, HH:MM" + retry | Full hero, live counts |
| Roster | "No submissions merged yet" + what will appear | 8 skeleton cards | Cached roster + stale badge per card | Grid |
| Certificate | Handle not in cohort → "No submission on record" + roster link | Skeleton certificate | Punch row renders from cache, checks show `unknown` not `failed` | Full certificate |
| Partners | n/a (static) | n/a | Form error inline, preserves input | Confirmation with what happens next |
| Method | n/a (static) | n/a | n/a | Standard + our scorecard |

**Never invent a state we can't distinguish.** If a check could not run, it renders `unknown`
(hollow punch, mono `?`), never `failed`. Conflating "we didn't reach it" with "it's broken"
would slander a peer, which is the single worst failure mode this product has.

## Accessibility

- Punches are **not** color-only: each carries a text label and an `aria-label` stating the
  verified fact ("ship: merged 31 Jul", "live: unknown, last checked 09:12").
- Keyboard: roster cards are links, focus ring visible at 2px `--mark`, skip-to-content first tab.
- Screen reader: the punch row is a `<ul>` with a caption naming the standard, not decorative SVG.
- Contrast checked at AA; the hollow punch outline meets 3:1 against paper.
- Respects `prefers-reduced-motion` — the punch "strike" animation is the only motion, and it
  is disabled entirely under that query.

---

## Why lo-fi first (the Build OS argument)

Build OS grades nine pillars in prose. UX/UI is the one pillar whose artifact is *text
describing pixels*, so it is the pillar where translation loss happens and where build time
goes. Drawing the screens at low fidelity — all states, tokens named, nothing styled — costs
under half an hour and turns the build into transcription.

Proposed grading bar for `V1`:

- **Weak:** "clean and modern," no drawing.
- **Good:** the happy path wireframed.
- **Great:** every screen in the flow at low fidelity, all four states *drawn not described*,
  layout grid + type scale + color **roles** named as tokens, and one screen at mobile width.
