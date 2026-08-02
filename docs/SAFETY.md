# SAFETY — Hallmark

## Trust boundaries (SH1 swap: where does untrusted content enter?)

Hallmark renders text written by 32 other people. Every PR body is **untrusted input**.

| Entry point | Neutralisation |
|---|---|
| PR body → one-liner, rendered on cards and certificates | React escapes all interpolated text. There is **no `dangerouslySetInnerHTML` anywhere in this codebase** — verifiable by grep. Markdown emphasis characters are stripped; the result is plain text, never HTML. |
| PR body → production URL, repo URL, profile URLs, rendered as links | Parsed through `new URL()`, which rejects malformed input. Only `http(s)` survives extraction, so `javascript:` and `data:` URIs cannot reach an `href`. |
| PR body → link labels | We resolve and display the **href**, never the markdown label, so `[safe.com](http://evil.example)` cannot mislead a reader about where a link goes. |
| GitHub avatar URLs | Restricted to `avatars.githubusercontent.com` by `next.config.mjs` `remotePatterns`. |
| GitHub API responses | Typed at the boundary; any non-2xx returns `null` and flows to `unknown` rather than being parsed optimistically. |

All outbound links to peer sites carry `rel="noopener noreferrer nofollow"` and open in a new
tab: `noopener` prevents reverse tab-nabbing, `nofollow` avoids conferring SEO weight on 32
sites we do not vet.

## Destructive actions (SH2 swap)

**There are none.** Hallmark has no write path: no auth, no database, no form submission, no
mutating endpoint. The application is a pure read of public GitHub state. There is no action a
user — or an attacker with full control of the client — can take that changes any state.

This is a design property, not a gap. The `/partners` CTA is a `mailto:` link precisely so that
no server-side write path exists for it (see `DECISION_LOG.md` §No forms).

## Security basics (SH10)

**Auth.** No accounts, no sessions, no private routes. Every route is public by intent, so there
is no authn/authz surface to get wrong.

**Secrets.** One secret: `GITHUB_TOKEN`, a read-only token used solely to raise the GitHub rate
limit from 60 to 5,000 req/hr. It is:
- stored in Vercel's encrypted environment store, never in git;
- excluded from the repo by `.gitignore` (`.env*.local`, `.env*`);
- never rendered, logged, or included in any client bundle — it is read only inside server-only
  modules, so Next would fail the build if it leaked into client code;
- functionally low-value: it grants read access to public data that is already public.

**Verified:** `git log -p | grep` for the token pattern returns nothing. There is no secret
scanning in CI — a gap, noted below.

**Dependencies.** `npm audit --omit=dev --audit-level=high` is a merge-blocking CI step. Zero
vulnerabilities at time of writing. This control is real and has already fired once: it is why
the project runs Next 16 rather than the 15.1.6 it was scaffolded with (`FAILURE_MODES.md` §F4).

**OWASP web Top 10, briefly:** no injection surface (no database, no queries); no XSS (no raw
HTML rendering); no CSRF (no state-changing requests); no broken access control (no access
control needed); no SSRF via user input (the URLs we fetch come from GitHub PR bodies — see the
honest caveat below).

**The one real residual risk:** the LIVE check fetches URLs extracted from PR bodies. A cohort
member could in principle put an internal address in their own submission and cause our build
server to request it. Mitigations: requests are `GET`-only with a 6s timeout, responses are
never rendered (we keep the status code and nothing else), and the actors are 32 known,
named participants in a supervised program. Not a general-purpose defence, and it would not
survive opening submissions to the public — recorded rather than hidden.

## Data handling (SH9)

**We store no user data.** No database, no cookies, no analytics, no session, no logs of our own.
There is nothing to retain, nothing to leak, and no deletion request we could receive that we
would need machinery to honour.

**Third-party data we display:** GitHub handles, display names, avatars, and links — all already
public on github.com, all published by the individuals themselves in a program submission
intended for exactly this audience.

**Vercel** retains standard request logs (IP, path, user agent) under its own retention policy.
That is the only place any visitor data exists, and we do not query it.

**Removal:** any cohort member who wants their row removed can open an issue on this repo and it
will be removed. There is no dark pattern in the way, because there is no account to delete.

## Refusals (SH7)

n/a — no model in the loop, no request that can be refused. Logged as a skip per §8E rather than
answered spuriously.

## Review

No adversarial security review has been run against this build. A §9 security-and-privacy
simulation is the highest-value remaining safety step; the SSRF caveat above is the finding I
would expect it to open with.
