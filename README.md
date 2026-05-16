# chriseldred.co.uk

A single-page booking site for jazz pianist Chris Eldred. Booking CV,
electronic press kit, and listening room in one scrolling page.

**Live:** https://chriseldred.co.uk (currently behind HTTP Basic Auth — see
[Auth gate](#auth-gate) below).

## Stack

- **[Astro](https://astro.build/)** — static-site build, no runtime framework.
- **YAML data** in `src/data/` — content lives here, not in templates.
- **Vercel** — static hosting + one serverless function for the contact form.
- **[Resend](https://resend.com/)** — transactional email for booking enquiries.
- **Cloudflare** — DNS + Email Routing (`hello@chriseldred.co.uk` →
  `[redacted]`).

## Layout

```
.
├── api/contact.ts       Vercel serverless function: form → Resend
├── middleware.ts        Vercel Edge middleware: HTTP Basic-Auth gate
├── public/              Static assets served at /
│   ├── favicon.svg
│   ├── photos/          Source photos (unused by current design; Vercel
│   │                    serves them if referenced)
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── data/            Content — edit these, not templates
│   │   ├── credits.yaml
│   │   ├── discography.yaml
│   │   ├── press.yaml
│   │   ├── sessions.yaml
│   │   ├── site.yaml
│   │   ├── socials.yaml
│   │   └── videos.yaml
│   ├── layouts/Base.astro
│   ├── pages/index.astro   Single-page template that loops over the YAML
│   ├── scripts/client.ts   Scroll-spy, mobile nav, lightbox, form submit
│   └── styles/global.css
├── ui-design-handoff/   Original Claude-Design HTML reference (not used at
│                        build, kept for posterity)
└── TODO.md              Local working list (gitignored)
```

## Develop

```sh
npm install
npm run dev    # localhost:4321
```

The project has a local `.npmrc` with `include=dev`. Required because nex's
global npm config has `omit=dev` set, which otherwise silently skips
devDependencies.

## Editing content

Most updates are pure YAML — no template work needed.

| To change… | Edit |
|---|---|
| The hero pull-quote, displayed email, page title | `src/data/site.yaml` |
| Credit rows (As leader / Hejira / Big bands / Vocalists) | `src/data/credits.yaml` |
| Press quotes | `src/data/press.yaml` |
| Discography rows + stream links | `src/data/discography.yaml` |
| Video tiles (first entry is featured) | `src/data/videos.yaml` |
| Sideman album rows in the listening panel | `src/data/sessions.yaml` |
| Instagram / YouTube / Spotify / Bandcamp links | `src/data/socials.yaml` |
| Hero portrait | Replace `public/photos/03-hero.jpeg` (the CSS references it directly) |
| The full biography prose, short bio prose | `src/pages/index.astro` (inline copy, not templated) |

Counts in credit-group headings (`02`, `01`, `05`, `06`) are derived from
each group's row count — no separate field to update.

## Deploy

```sh
git push origin main      # auto-deploys via Vercel
```

Vercel is wired up to redeploy on every push to `main`. The contact form
is gated to its API endpoint at `/api/contact` and routes to a Vercel
serverless function backed by Resend.

To test the live form end-to-end:

```sh
curl -s -X POST https://chriseldred.co.uk/api/contact \
  -u 'preview:badtemp' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"you@example.com","message":"Smoke test."}'
```

## Auth gate

While the site is in review, every route is gated by HTTP Basic Auth:

| Var | Value |
|---|---|
| `BASIC_AUTH_USER` | `preview` |
| `BASIC_AUTH_PASS` | `badtemp` |

The gate is implemented in `middleware.ts` and short-circuits to "allow"
when either env var is missing. To drop the gate:

```sh
vercel env rm BASIC_AUTH_USER production --yes
vercel env rm BASIC_AUTH_PASS production --yes
vercel --prod --yes
```

## Email path

A booking enquiry travels:

```
Form submit
  → POST /api/contact (Vercel function)
  → Resend, FROM bookings@chriseldred.co.uk, TO hello@chriseldred.co.uk
  → Cloudflare Email Routing (MX records on chriseldred.co.uk)
  → forward to [redacted] (verified destination)
```

DNS / DKIM / SPF for both Resend (sending) and CF Email Routing (receiving
and forwarding) live on the `chriseldred.co.uk` zone on Cloudflare.

## Domain

- `chriseldred.co.uk` is the canonical host.
- `www.chriseldred.co.uk` 308-redirects to apex.
- Cloudflare DNS-only (no proxy); Vercel handles SSL.
