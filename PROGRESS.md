# Progress

## 2026-10-08
- Branch `v3-rebuild`. The old site is out of the tree; `main` keeps it. Nothing is committed (owner: no commit or push until asked).
- Owner gate: four rounds and 16 directions (A to L, J1 to J6). The directions still run in dev from `directions/index.html`.
- Picked: J1, forest and lime. Owner: "start the full suite and the SaaS build".
- Built:
  - 17 prerendered routes: home, how it works, photos, documents, pdf, batch, pricing, API (`/developers`), security, FAQ, about, contact, privacy, terms, sign-in, account, 404. Plus the sitemap, robots, manifest, offline worker, social image and `_headers` with CSP.
  - Worker (`worker/index.ts`): emailed sign-in links, sessions, Lemon Squeezy webhook, API keys, team seats, saved policy, hosted API `/api/v1/*` with quotas and signed reports.
- Checks: `node tools/saas_check.mjs` passes 16 of 16. `python3 tools/site_check.py` passes in Firefox and Chromium at 8 sizes.
  Both need `npm run build && npx wrangler dev --port 8787`. Restart wrangler after every build: it keeps a stale asset list.

## Next
Logo A6 applied (DECISIONS.md). Critic PASS in round 2. Next: the owner reviews, then ask before deploy, then the Before deploy list.
Owner inputs needed before launch: prices, Lemon Squeezy store and variants, filesanity.com onboarded for Cloudflare Email Sending, a Turnstile widget, company facts (PLACEHOLDERS.md).
