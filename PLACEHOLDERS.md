# Placeholders

2026-10-09: the owner asked to remove the on-page placeholder marks and show real data. Prices and limits now show unmarked (taken as confirmed by that request; owner to change in `src/site/plans.ts` if not). Company facts show what the owner has stated: authegg, independent, Philippines. The rest below is still config to fill before deploy.

| What | Where | Value now | Needs |
|---|---|---|---|
| Plan prices | /, /pricing, /account (`src/site/plans.ts`) | Pro $6, Team $24, API $29 a month | Owner's prices. Research anchors are in RESEARCH.md: metacleaner EUR 5/30/50, Google Drive cleaner $8, iLovePDF $4 to $7, Acrobat Pro $19.99 |
| Plan limits | same | API files a month: Free 50, Pro 1,000, Team 5,000, API 50,000. Max file 10/50/50/100 MB. Team 5 seats | Owner confirmation |
| Lemon Squeezy buy links | `src/site/plans.ts` | done 2026-10-10: products 1427414/1427424/1427428, variants 2229415/2229436/2229440 (test mode) | Live-mode webhook after store activation, then a test purchase and refund |
| Company facts | /about, /privacy | "authegg, an independent studio based in the Philippines" | DTI registration number and address once issued, if the owner wants them shown |
| Turnstile site key | `VITE_TURNSTILE_SITEKEY` at build | Cloudflare's always-pass test key | A real widget for filesanity.com, and its secret as `TURNSTILE_SECRET` |
| Sign-in sender | `wrangler.jsonc` MAIL_FROM, `send_email` | signin@filesanity.com | filesanity.com onboarded as a sending domain in Cloudflare Email Service (SPF/DKIM records) |
| Sample files' metadata | public/sample.jpg, public/samples/* | Invented people and places (M. Okafor, Oxford) | None; the footer says so |
| Domain, repo, mailbox | everywhere | filesanity.com, github.com/authegg/filesanity, hello@filesanity.com | As on main (the mailbox was live in v2) |
