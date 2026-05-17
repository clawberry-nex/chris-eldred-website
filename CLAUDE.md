# CLAUDE.md — chriseldred.co.uk

Project-specific notes for Claude sessions in this repo. Read `README.md`
for the human-facing overview; this file is the things that aren't obvious
from a fresh code read.

## What this is

Single-page Astro site for jazz pianist Chris Eldred (booking CV / EPK).
Live at https://chriseldred.co.uk, currently gated by HTTP Basic Auth
during pre-launch review. Credentials live in Vercel env
(`BASIC_AUTH_USER` / `BASIC_AUTH_PASS`) — not in this repo. Ask the
project owner if you need them.

## Where to edit content vs. templates

**Content lives in `src/data/*.yaml`.** The template at
`src/pages/index.astro` iterates over those imports. If you find yourself
editing JSX/HTML to add a credit row or a press quote, stop and edit the
YAML instead.

Two prose blocks stay inline in `src/pages/index.astro` (the short bio
under `#bio` and the long-form biography under `#biography`). Everything
else is data-driven.

## Don't reintroduce these placeholders

The original Claude-Design prototype had three fabricated items the
handoff README flagged. They have been removed/relabelled:

- The credit row "Chris Eldred Trio" was renamed to **"His own trio"** —
  the bio refers only to "his own jazz trio."
- The credit row "Solo piano · Late-night sets, supper clubs, private
  dates" was **invented context** and is gone. Don't add it back.
- Video tile titles, venues and years in the prototype were placeholder
  text. The current 5 tiles are real YouTube videos sourced from
  `ui-design-handoff/assets/docs/youtube_links.md`. Thumbnails come from
  `i.ytimg.com/vi/{id}/maxresdefault.jpg`.

## The auth gate

`middleware.ts` at the project root is a Vercel Edge Middleware that
gates every request on HTTP Basic Auth using `BASIC_AUTH_USER` /
`BASIC_AUTH_PASS` env vars. **If either env var is missing the gate is
disabled** — that's the supported way to remove protection later, no
code change required.

## Email path

Booking-form delivery is multi-hop:

```
form POST
  → Vercel function (api/contact.ts)
  → Resend (FROM bookings@chriseldred.co.uk, TO hello@chriseldred.co.uk)
  → CF Email Routing (MX records on chriseldred.co.uk zone)
  → Chris's verified destination address
```

If the form starts bouncing, check both legs:
- Resend dashboard for send status (delivered / bounced / blocked)
- Cloudflare → Email → Email Routing for the rule + destination status

The display address shown on the site (`src/data/site.yaml::displayEmail`)
intentionally differs from the actual gmail. The handoff README
documents this choice.

## Deploy quirks

- **Vercel Hobby plan**: auto-deploys gate on commit author. Resolved
  globally on nex by setting git identity to `clawberry-nex`
  (see `~/CLAUDE.md`). If you ever see a deploy stuck in `UNKNOWN`
  status, it's almost certainly an author mismatch — check
  `git log -1 --format='%an <%ae>'`.
- **Env var changes auto-trigger a redeploy.** Each `vercel env add/rm`
  on a production var queues a new build. Don't be surprised by extra
  deploys appearing in the list after env work.
- **Local `.npmrc` has `include=dev`** to work around nex's global
  `omit=dev`. Don't delete it — without it, build dependencies fail
  to install.

## DNS records of note (on Cloudflare zone chriseldred.co.uk)

- `A @ 76.76.21.21` — Vercel anycast (apex)
- `A www 76.76.21.21` — Vercel anycast (www → 308 to apex)
- `MX @` × 3 (priorities 46/81/100) — Cloudflare Email Routing receivers
- `TXT @` SPF — for CF Email Routing forwarded mail
- `TXT cf2024-1._domainkey` — CF Email Routing DKIM
- `TXT resend._domainkey` — Resend DKIM
- `MX send 10 feedback-smtp.eu-west-1.amazonses.com` — Resend bounces
- `TXT send` SPF — for Resend's sending subdomain

All proxy=off (DNS only). Don't enable orange-cloud proxy without
adjusting Vercel + cert config.

## ui-design-handoff/ (local-only)

The original Claude-Design output (HTML prototype, photos, design brief,
quotes, bio, CV) was committed during initial build but is now
gitignored. It still lives on the original maintainer's machine at
`~/projects/chris-eldred-website/ui-design-handoff/` if you need to
sanity-check a CSS change against the visual ground truth — but a fresh
clone won't have it. The same applies to `claude-design-prompt.md`.

If you do see the folder locally, the useful files are `README.md` (a
detailed spec) and `Chris Eldred.html` (the working prototype).

## TODO.md

Gitignored local working list. Don't commit it. Don't lecture the user
about why it exists — they made it explicitly untracked.

## What not to do

- Don't introduce a CSS framework. The site is hand-rolled CSS by
  design (matches the prototype's letterpress feel).
- Don't move content out of YAML into TS/JS unless there's a specific
  reason. The structured-data convention is part of the handoff brief
  so non-technical edits stay easy.
- Don't enable Cloudflare proxy on the Vercel records without first
  reviewing Vercel docs on Full(strict) SSL.
- Don't `npm audit fix --force`. Astro/Vite have known transitive
  advisories that are not exploitable in this static-build context;
  forcing fixes risks pulling breaking changes.
