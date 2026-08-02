# UX — Hallmark

Visual specification and wireframes live in [`VISUAL.md`](./VISUAL.md) and
[`wireframe.html`](./wireframe.html) / [`wireframe-card.html`](./wireframe-card.html). This
document covers flow, states, feedback and accessibility.

## The two flows

**Builder (primary, `[builder]`-confirmed JTBD):** just shipped → lands on own certificate →
sees marks struck → one click to post the card. Four steps, no writing required.

**Partner (secondary):** landing → reads what a mark means → roster → certificate → live
production link. Four clicks from arrival to someone's working software.

## States

Implemented per screen. Nothing here is aspirational — each is in the code.

| Screen | Empty | Loading | Error / degraded | Success |
|---|---|---|---|---|
| `/` | "The assay opens when the first submission merges" + link to the standard | Static render; counts show `—` | Banner: source unreachable + explicit "nothing below is a judgement on any builder" | Hero, live counts, roster preview |
| `/cohort` | "No submissions have merged yet" + what will appear | Static render | Banner, empty roster rather than a stale guess | Alphabetical grid |
| `/builder/[handle]` | `not-found.tsx`: "No submission on record" + "may simply mean their PR has not merged yet" | Static render | Marks render `unknown`, never `failed` | Certificate + ships + card |
| `/partners` | n/a (static) | n/a | n/a | Guarantees, limits, mailto CTA |
| `/method` | n/a (static) | n/a | n/a | Checks, false negatives, our own scorecard |

Because pages are statically generated, "loading" is not a spinner state in practice — the HTML
arrives complete. The skeleton treatments in the wireframe were designed for a client-fetching
architecture we then chose not to build (ADR-0001); they are retained in the spec as the
fallback design if ISR is ever replaced by client fetching.

## The state that matters most

`unknown` versus `not-yet` is the central UX decision of this product, and it is carried by
three redundant channels so it survives colour-blindness, greyscale and screen readers:

1. **Border style** — solid (struck) / solid-thin (not yet) / **dashed** (unknown)
2. **Glyph** — the mark's own symbol / same symbol muted / **`?`**
3. **Accessible label** — "verified" / "not yet" / **"not checked"**, each followed by the
   specific fact ("live: not checked — could not reach x.vercel.app within 6s")

A `not-yet` mark is never rendered in the fault colour. There is no red on the roster.

## Feedback (UX1 swap: how a user tells us it's wrong)

Every certificate carries **"a mark wrong? tell us"**, which opens a pre-filled GitHub issue
containing the page URL and the current state and evidence of all four marks. A peer can dispute
a mark in two clicks, and the report arrives already actionable.

It is GitHub-native on purpose: no form, no database, no account, no stored data — the same
constraint that governs the rest of the product (ADR-0001). The correction channel had to obey
the architecture rather than punch a hole in it.

**Honest limits of this affordance:** it is a report channel, not a resolution loop. There is no
SLA, no status visible to the reporter beyond the issue itself, and correcting a systematic
mis-parse still requires a code change by us. A peer who never visits their own certificate will
never see the link.

Per ADR-0001 the fix is deliberately not "let builders edit their page" — it is a
builder-submitted correction that is itself verifiable. Tracked in `DECISION_LOG.md` §Scope cuts.

## Accessibility (SH6)

- **Not colour-only.** Every mark carries a visible text label plus an `aria-label` stating the
  verified fact. The punch row is a `<ul>` with an accessible name, not decorative SVG.
- **Keyboard.** Skip-to-content is the first tab stop. Roster cards are single links (whole card
  focusable, not nested interactive elements). Focus ring is 2px `--mark` at 3px offset, visible
  against both themes.
- **Contrast.** Body text and `--mark` on `--paper` meet WCAG AA (4.5:1); punch outlines meet 3:1
  for non-text contrast. Dark theme lightens `--mark` to `#D8B45A` specifically to hold AA.
- **Motion.** The punch "strike" animation is the only motion on the site and is disabled
  entirely under `prefers-reduced-motion`.
- **Zoom / reflow.** Single-column at 375px, no horizontal scroll; the punch row wraps to 42px
  punches rather than shrinking text.
- **Theme.** Respects `prefers-color-scheme` in both directions.

**Not verified:** no screen-reader pass with an actual assistive technology, and no automated
axe run. The above is designed-for and code-reviewed, not user-tested — stated here rather than
claimed as tested.

## Critique

Not yet run. A §9 design critique is the highest-value remaining Build OS step for this pillar
and is queued in `DECISION_LOG.md`.
