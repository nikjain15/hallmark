# 90-second walkthrough — shot-by-shot script

Build OS SH4 asks for a 90-second walkthrough **for a non-technical person**. The rubric:
`weak` = explains the tech stack · `good` = demos features · `great` = leads with the outcome in
one sentence, shows it working, names one honest limitation.

Record with QuickTime screen recording (or Loom). Two takes is normal. Don't script it word for
word — read this once, then say it in your own words.

**Total: 90 seconds. Four shots.**

---

## Shot 1 — the one sentence (0:00–0:12)

**On screen:** `hallmark.vercel.app` home page, top of the hero.

**Say:**

> "Thirty-two people in my cohort each built three products in three weeks. If you're hiring,
> that's ninety repos to check, and most of the links are dead. This checks all of them for you."

**Why this and not something else:** it opens with the listener's problem, not the product. Do
not say "assay", "verification layer", or "Next.js" in the first twelve seconds. The word
"hallmark" doesn't need explaining yet.

---

## Shot 2 — show the marks (0:12–0:40)

**On screen:** scroll slowly to the four punches. Then click into a builder with all four
struck — `artira` is a good one.

**Say:**

> "Every person gets four marks. Did they actually submit it. Is the website actually online
> right now. Did they write documentation. Is the code public. That's it — four things, checked
> the same way for everyone, by a script."

**Then click the production link so it opens their real site.**

> "And that link is live, because we checked it eleven minutes ago."

**Why:** this is the moment the idea lands. A non-technical viewer understands "the link works"
far better than any explanation of the architecture.

---

## Shot 3 — the honest bit (0:40–1:05)

**On screen:** go to a builder with a partial row — `alaskalam` — so the hollow and dashed
punches are visible. Then scroll to the gap list.

**Say:**

> "Not everyone has all four, and that's fine. An empty mark means 'not yet' — and it tells them
> exactly how to fix it. This one says: add a README and this lights up. It re-checks itself
> every half hour."

> "And if we couldn't reach someone's site, we say 'not checked' — we never say it's broken.
> That's a real person's work, and we're not going to be wrong about it in public."

**Why:** this is the strongest 25 seconds in the video. The restraint *is* the product.

---

## Shot 4 — the limitation, then stop (1:05–1:30)

**On screen:** `/method`, scrolled to "What a mark does not mean".

**Say:**

> "Here's what it can't do. It doesn't read anyone's code. Four marks means four facts were
> true — it does not mean the software is good. That's still your judgement, and we say so on
> the site in the same size type as everything else."

> "That's Hallmark."

**Stop recording.** Do not add a features montage. Do not mention the API, the badge, or the
scorecard — they are for a different audience and they will cost you the ending.

---

## Checklist before recording

- [ ] Roster is populated (check `hallmark.vercel.app/cohort` shows 30+ builders, not the
      degraded banner — see `FAILURE_MODES.md` §F7)
- [ ] Browser zoom at 125% so text is legible in a compressed video
- [ ] Close other tabs; hide the bookmarks bar
- [ ] Dark or light both look fine — dark reads better in a feed
- [ ] Say "not checked", never "failed", when describing a dashed mark

## Where it goes

`README.md` §Walkthrough, and the PR body if it's recorded before Roger merges.
