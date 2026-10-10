# FileSanity v3: decisions

Branch `v3-rebuild`, from a blank page, 2026-10-08. v1/v2 on `main` are reference only.
Owner answers (2026-10-08): scope **full SaaS now**; build on **a new branch here**; verify in **Firefox 1917x870 and a 390x844 phone**, plus 1366x650.

## Scope calls
- Scope: full SaaS (sign-up, billing, batch, API keys) as the owner chose. Rejected: product site plus pricing only (my recommended default; the owner overrode it).
- Studio scope note: the studio layer covers marketing pages only. The marketing pages follow it. The account screens (sign-in, billing, keys, usage) are app UI and get built from a named product (decided after the pick), not from a "move". Rejected: forcing a move onto the dashboard (tup-hris, 2026-09-21).
- Kept from v2: `src/lib` and its fixtures only. The page-driven `tests/run.py` was replaced by `tests/lib.mjs` plus `tests/lib.py`, which assert the same bytes with no page (all pass, 2026-10-08). Rejected: keeping run.py, which is tied to the v2 DOM.
- Sample still: Codex (`codex exec -s workspace-write`; the skill's `--full-auto` flag no longer exists in codex-cli 0.158). Rejected: Higgsfield, which has 1.55 credits left. The subject matches the sample's invented metadata (a bicycle on Holywell Street, Oxford), so the photo and its fields tell one story.
- `tools/make_samples.py` kept. It now reads the new still, so it rewrote `tests/files/photo.jpg`, and the parser tests still pass.
- Hero image: AVIF q30 at 1536w, 130 kB, under the 200 kB budget. Rejected: showing `sample.jpg` itself (278 kB, and the file has to stay a JPEG with metadata).
- Research: `RESEARCH.md`, 19 products. I re-checked its key claim myself: metacleaner.com says "Runs in your browser", and its uploader POSTs the file to `/public/files` (uploader script, read 2026-10-08).

## Ledger check (last three rows: filesanity v2, tup-hris, nexakron)
Shared by all three: a light ground by default; one accent (identity, allowed); a sans as the UI face; one theme.
Each direction below names its NEW line, and its reason wherever it keeps the light ground.

## First association (rejected)
```
Reading this as: product site for people who send files, soft-structural trusted-SaaS, serving anchor 1.
```
That is v2 again: a silver page, a white plate holding the tool, Geist. Rejected because it is the last row of the ledger, and the brief says to rebuild from a blank page.

## Direction A: "Zero" (position 1, provably local)
```
Reading this as: product page for journalists, lawyers and the privacy-minded, a dark measuring instrument, serving anchor 1 (the object is the headline).
MOTION 4: one live number, the requests this page has made since you dropped your file, which must stay 0.
RISK: the largest thing on the first screen is a live counter of network requests, set at display size; it is the proof, and it would show a leak.
COST: a giant 0 can read as a broken stat or a blank; the label carries it. Rejected larger risk: a page with no headline at all, just the 0 (fails AA-of-meaning for cold visitors, and the client asked for professional).
SEEN: a near-black page with one enormous pale-blue "0" filling the right half, a short headline and a pill at left, a drop field under them.
NEW: a dark ground by default (all three ledger rows are light).
GREP: counter, live number, zero, dark ground, network
```
Type IBM Plex Sans Variable with tabular figures; Plex is a company's face, sober, with true figures. Rejected: mono everywhere (the Dark technical cluster), and Geist (v2).
Accent "counter blue" #8EC5FF: the one colour, used only for the count and the focus ring. Rejected: acid green or amber (the Dark technical cluster).
Cluster check: Dark technical. It is dark, but there is no mono body, no hex dump, no terminal and no acid accent, so I claim the exception: the dark ground exists so a single light number is the brightest thing on the screen.

## Direction B: "What it says" (position 2, a plain account)
```
Reading this as: product page for marketplace sellers, HR and anyone sending a photo, full-bleed photographic, serving anchor 2 (the interaction carries it).
MOTION 4: the headline and the page ground are computed from the file you drop: a sentence written from its fields, and a ground sampled from its pixels.
RISK: the headline is not ours. It is the sentence your file tells about you, and it rewrites when you drop a different file.
COST: a long data sentence can run to four lines or read as an error; it is capped at four facts and set at text-4xl. Rejected larger risk: no product copy at all above the fold (the client said professional, and a cold visitor needs to know what the site is).
SEEN: a full-bleed warm photograph of a bicycle against a stone wall, with one long white sentence over its lower left; below, a stone-coloured page with four short groups.
NEW: a full-bleed photograph as the first screen's ground, and a ground colour taken from that photograph.
GREP: full-bleed, photograph, headline generated, sampled colour
```
Light ground below the fold: it is not a fixed paper. It is the dominant colour of the visitor's own photograph (honey stone for the sample), so this brief's own file sets it.
Type Figtree Variable, geometric with open counters; reads as a consumer tool. Rejected: a grotesk (the house reflex), and serif (not editorial).
Cluster check: none of the five.

## Direction C: "The record" (position 3, batch with a policy and a record)
```
Reading this as: product page for small law firms and HR teams, a legal pad, serving anchor 3 (content blocks are the layout, here ruled lines).
MOTION 3: still; each dropped file writes one line onto the pad as it is read (feedback, not decoration).
RISK: the whole page is a yellow legal pad: canary ground, blue rules, the double red margin line running the full height, and the batch's cleaning record written on the lines.
COST: yellow can read as cheap or loud to a 1Password-trained eye; the type stays black and calm to hold "professional". Rejected larger risk: handwritten type on the pad (fails the client's "professional").
SEEN: a canary-yellow page ruled in thin blue lines, with a double red vertical line near the left edge from top to bottom, and black type sitting on the lines.
NEW: a saturated yellow ground (none of the three rows), and a full-height double margin rule.
GREP: legal pad, yellow, ruled lines, margin, record
```
Type Source Sans 3 Variable, Adobe's office-document sans; it sits on the lines like typed notes. Rejected: Source Serif (it would drift into the Editorial cluster: rules plus serif).
Accent "margin red" #B3262E, from the pad's own margin line: the line, the pill and the focus ring only.
Cluster check: Editorial means cream plus a serif plus terracotta. Here the ground is canary, there is no serif, and the red is the pad's own margin line. Exception claimed.

## Common to all three directions
- Stack: React + Vite, with plain CSS per direction. Rejected: Tailwind for the directions (three separate token sets in one utility namespace would blur them). Revisit after the pick.
- Picker: one headless hook (`src/shared/useCleaner.ts`): drop, paste, sample, a hidden input opened only from the custom control, and states idle, over, reading, ready, cleaned, error. Each direction only paints it.
- Trust-first quiet constraint: grids stay symmetric and plain. The risk in each direction lives in colour, data or ground, not in layout novelty.

## Build calls before the gate
- A: the zero moved to the left column. The first build put the headline top-left over a grey sub and one button, which is the House composition. Rejected: keeping it and logging it, because the counter is the risk and it should lead.
- A at phone: the zero drops to 7.5rem beside its caption so the drop field stays inside the 390x844 fold. The risk is weaker on a phone. Rejected: keeping it at full size, which pushes the picker below the fold.
- B: the scrim is darkened until the white copy measures 9.7:1 and the nav 6.2:1 against the lightest pixel behind them (the first scrim measured 3.4 and 2.2). Rejected: a text shadow, which does not count toward AA.
- B: reads `sample.jpg` (278 kB) after the load event, so the account below the hero is real data. That is lazy weight, reported and not capped. The first-paint headline is a constant checked against `say()` in dev. Rejected: computing it at load, which would make the LCP wait on the sample.
- B: the sampled ground's saturation is doubled (capped at 42%), because shadows pull the average grey. Lightness is fixed at 91% for the ground and 11% for the ink, so AA holds for any hue.
- C: the pad opens with the three sample files read for real and marked "sample". The visitor's own files replace them. Rejected: an empty sheet (half the first screen was blank).
- C at phone: the big drop line keeps one rule's height, so it sits on the pad's lines.

## Owner gate, round 1 (2026-10-08)
A, B and C rejected: "none". No reason given yet. Asked one question before building again. Rejected: guessing a fourth direction blind (nexakron: four owner-viewed variants fixed it; blind rounds did not).
Answer: "Not professional enough." Round 2 is calm product-company pages with the distinctive part kept small. The owner's word sets the register. The trust-first quiet constraint now governs fully: MOTION 2, symmetric grids, no layout novelty.

## Round 2 (2026-10-08)
References (inspo archive): Diffusion Studio, Mintlify, Anima. The mechanism taken is the real product framed as an app window right under the headline. Rejected: their banners, "New" pills and logo walls (tells, and FileSanity has no customers to show).
Shared by D, E and F:
- One working component, `src/shared/AppWindow.tsx`: a file list, fields grouped by what they give away, batch, one zip, a report. It opens on the three samples, read for real.
- One page skeleton, `src/shared/ProductPage.tsx`: how it works, what each kind gives away, why there is nothing to trust, pricing, questions, a closing line, a three-column footer. The variants differ in register, hero composition and story.
```
RISK (all three, kept small on purpose): the window's own title bar carries the live count of the page's network requests since your files arrived, reading 0. It is the proof, printed at 13px where an app shows its sync status.
COST: small enough to be missed; the "Why there is nothing to trust" section points back at it. Rejected larger risk: round 1's display-size counter (A), which the owner rejected as not professional.
SEEN: a calm product page with a headline and two buttons over a framed app window listing three files and a table of GPS, names and dates.
```
- D, light and centred: off-white page, IBM Plex Sans, statement blue #2448b5. The headline is the brief's fixed fact. Shares the light ground and single accent with all three ledger rows; the reason is the owner's "professional", read as the 1Password and Proton register. NEW: the product framed as an app window, which none of the three rows did (v2 had a panel plate; nexakron had screenshots).
- E, navy and split: deep navy page, Figtree, sea-glass teal #74d2c2, copy left and the window right. NEW: a dark ground (none of the three rows).
- F, warm stone and left-aligned: stone page, Source Sans 3, ledger green #1f5c49, 8px corners, the batch-and-report story. Cluster check: Editorial (cream, serif, terracotta). Here there is no serif and the accent is green; the stone is the one warm surface. NEW: square 8px controls (all three rows used pills or plates).
- Calls made in all three:
  - Footer: three link columns plus a brand line. Rejected: four columns (a link farm tell) and a one-row footer (the House tell).
  - Pricing: three equal cards with no "popular" badge. Rejected: a taller middle tower (a tell).
  - FAQ: an open list. Rejected: an accordion (a tell).
  - Step markers: numbered circles on "Drop / Read / Clean". The verbs are the labels; no "Step 1".
- Contrast: every text token pair passes AA (lowest 6.2:1). `tools/gate.py ... def` passes in Firefox and Chromium.

## Owner gate, round 2 (2026-10-08)
D, E, F rejected: "all rejected". Owner asked to check what sites are trending now and apply it. Next: a trend scan with sources (TRENDS.md), then directions built on named live sites. Rejected: a third round of my own registers without outside references.

## Round 3 (2026-10-08): from what is trending
`TRENDS.md`: 14 live sites screenshotted today. The owner chose all four trends offered, so there is one direction each:
- G object hero (Butter, Moto)
- H cinematic photo (Mercury)
- I serif product page (Granola, incident.io)
- J owning a colour (Mullvad)

Rejected: the product window under the headline (trend 4). It is round 2, already rejected, and it is now the category default.
Images: Codex. G is a 3D render of a photo print with blank luggage tags, on pale grey. H is a lone envelope on a salt flat. Rejected: Higgsfield (1.55 credits).
- G object: the render's own grey (#dadde1) is the page ground and the image edge is feathered. The sample's real fields (who, where, when, device) are printed on the four blank tags, and they drop away on clean. The whole hero takes drops. Onest, graphite accent. NEW: a 3D-rendered object as the hero.
- H cinematic: the salt flat fills 82svh, the copy sits in its sky, and the tray overlaps the photo's foot. A light veil over the top two thirds puts dark text at 13.3:1 (copy) and 9.9:1 (lede) against the darkest pixel; without it, 2.7 and 2.5 (fail). Cost: the mountains read paler. Manrope, dusk slate accent. NEW: a full-bleed landscape with a centred headline in its sky.
- I serif: Source Serif 4 at opsz 60 for display, with "your" in italic, and Source Sans 3 for the UI. Docket red accent. The tray sits beside the copy. Cluster check: Editorial means cream, serif and terracotta. Here the ground is a cool off-white and the red is crimson. Exception claimed on the owner's choice of the Granola trend. NEW: a serif display in a product hero.
- J own a colour: deep green across every section, Archivo at 112% width, uppercase lime buttons. The tray is a cream sheet tilted -2.5deg while idle; it straightens on hover, on focus, once a file is in, and under reduced motion. NEW: a saturated colour ground on every section.
- Gate (Firefox and Chromium): all four pass the sample, clean, zero requests, clean output, no overflow at 320/390/1917, and H's measured contrast. Token AA lowest 5.7:1 (J muted).

## Owner gate, round 3 (2026-10-08)
G, H, I, J rejected: "all rejected". That makes 10 directions rejected over three rounds, and only one round had a reason. Stopped building blind. Asked the owner for a concrete anchor instead. Rejected: a round 4 of my own guesses (nexakron 2026-10-06: blind rounds did not converge; one owner-chosen reference did).
Owner's answer: "go ahead and guess a fourth time. I don't know what I want anyway."

## Round 4 (2026-10-08): motion leads
Diagnosis: all ten rejected directions were near-still (MOTION 2 to 4), and rounds 2 and 3 shared one lower page, so they likely read as one page in different skins. On nexakron (2026-10-06) the owner picked the scroll story out of four variants. So: two motion-led directions, each designed top to bottom, not skins on a shared skeleton.
Engine: `src/shared/useProgress.ts`. One passive scroll listener, batched through requestAnimationFrame, writes `--p` (0 to 1) on the story element; CSS turns it into opacity and transform only. No motion library (rejected: Motion, about 15 to 35 kB, and the budget question). Reduced motion unpins the stage and renders the resting state (checked by emulation: `position: static`).
```
K. Reading this as: product page for anyone sending photos, a light Apple-privacy-style scroll story, serving anchor 2 (motion carries the hierarchy).
MOTION 7: a 420vh pinned stage. The sample photo grows; its four real giveaways (who, where, when, on what, read from the file) pin onto it, then are struck and stripped; "52 hidden fields removed" lands.
RISK: the first scroll is a story about the visitor's own kind of file, built from a real file's fields, before any product chrome.
SEEN: a large bicycle photo under a two-line headline, with white pill labels pinned to it (in the thumbnail, the resting first frame).
NEW: a pinned scroll stage whose content is the product's real output.
```
```
L. Reading this as: product page, a dark studio object, serving anchor 1 (the object is the headline) with anchor 2's mass.
MOTION 7: the print tilts toward the pointer with eased mass; scrolling cuts the four tags loose and they fall while a count runs from the sample's 52 fields to 0.
RISK: a rendered object whose parts physically leave: the tags were keyed out of the render into their own layer (base inpainted with OpenCV), so they really fall away from the print.
SEEN: a charcoal page, a glossy photo print floating right with four paper tags reading M. Okafor, Oxford, 11 April 2026, iPhone 16 Pro, and a three-line headline left.
NEW: a dark ground with a separable 3D-rendered object.
```
- K: Onest, statement blue #1f4fd6. L: Manrope, paper cream #f2e7cf as the one light accent on #161718 (the render's own charcoal).
- Moving-element check: shots at 0, 30, 50, 70 and 95% of each story, at 1917x870, 390x844 and 412x915. Labels collided and the photo overflowed in K's first pass; both fixed. No overflow.
- Gate: Firefox and Chromium pass (sample, clean, zero requests, clean output, no horizontal scroll at 320/390/1917).

## Owner gate, round 4 (2026-10-08)
Owner: "what caught my eye is letter J Own a colour could you generate multiple variants of it". J is the pick to develop. Next: J1 to J6, the same layout with different owned colours and type widths.
- J variants (one page, tokens by URL /j1/ to /j6/). Same layout, headline and tilted tray; the colour pairing and the headline width change:
  - J1 forest #0d5641 with lime, Archivo 112% (the original)
  - J2 cobalt #1d3cc4 with butter, 125% at 850 (the closest to Mullvad, said plainly)
  - J3 signal orange #f07436 with black ink and a black button, condensed 75% at 850, sentence-case buttons
  - J4 aubergine #3b1d48 with peach, normal width at 700, sentence case
  - J5 sage, light: #d3e5d6 with deep forest ink and button
  - J6 ink teal #0b4d59 with coral #ffa184, 125% at 600

  AA: the lowest pair is J6 coral as link text, 4.81:1. J3's first orange (#e0561f) failed muted text at 4.05 and moved to #f07436; J6's first coral failed as text at 4.24.
- Gate: J1 to J6 pass in Firefox and Chromium.
- Wordmark: "Sanity" takes the accent (`.mark-s`), so the name shares the one action colour. Recommended J1 lime on forest: green reads as "all clear", the state the product promises. Rejected: orange or red for the word (alarm). On J3 and J5 the accent is the ink, so the word cannot split there; that counts against those two.

## Owner pick and the build (2026-10-08)
After the J variants and the offer write-up, the owner said: "start the full suite and the SaaS build". J1 forest and lime is the one I had recommended, so it is taken as the pick. Rejected: asking again. The owner had seen all six variants and the recommendation.
```
Reading this as: a product site with a small SaaS behind it, for people who send files to strangers. One owned colour, Mullvad-style: deep forest on every section, Archivo wide headings, lime for every action. Serves anchor 2: one accent, and the craft is in the working tool.
MOTION 3: trust-first. The idle tray tilts and straightens on hover, on focus and when a file arrives. Nothing else moves.
RISK: one saturated forest green on every section of every page, legal and account included, with each tool a cream sheet laid on it.
COST: it can read as a campaign rather than a utility, and the legal pages lose some gravity. Rejected larger risk: a lime ground. Muted text fails AA on it, and lime everywhere shouts.
SEEN: a page-long deep green column, a cream drop sheet top right, a photo beside a field list, a giant cream "0" mid-page, four dark plan cards. (Updated 2026-10-09: the tilt was removed and the 0 turned cream, both owner fixes; the old line said "tilted" and "lime".)
NEW: a saturated colour ground on every section. None of filesanity v2, tup-hris or nexakron has one.
GREP: "colour ground", "saturated", "one theme per page", "sections do not invert"
```
Counter-read, rejected: anchor 1, with the tray as a hardware object on a flat grey field. That is round 3's G, which the owner rejected.

### Stack and architecture
- Stack: React 19 and Vite, with every route prerendered to its own `<route>.html` (served at `/pricing` with no trailing slash) and hydrated. Plain CSS. Rejected: Tailwind (it is installed, but the J tokens are plain CSS variables already) and a router library (pages are plain anchors).
- Server: one Worker serves the static assets and answers `/api/*` (`run_worker_first`). Rejected: main's separate `api.filesanity.com` Worker. One deploy, same-origin cookies, no CORS for the account calls.
- Storage: KV, one record per account plus the key hashes and counters. Rejected: D1 (nothing relational here).
- Sign-in: an emailed link, single use, valid 15 minutes. Sent through Cloudflare Email Sending (2026-10-09, owner: "use cloudflare email as we already have it"); rejected: Resend, a second vendor holding visitors' addresses. Rejected: passwords (a hash store to protect) and Google sign-in (a third party inside a privacy product).
- Session: one cookie, `fs_s`, HttpOnly, Secure, SameSite=Lax, 30 days, stored hashed. Account writes require a same-origin `Origin` header. This replaces v2's "no cookies" constraint for signed-in pages only. No banner, because the cookie is strictly necessary.
- Turnstile: on the sign-in form only, verified server-side. Rejected: site-wide, because the marketing pages stay free of third parties. The `/sign-in` CSP alone allows challenges.cloudflare.com.
- Marketing pages never call `/api`. The nav always says "Account". Rejected: showing the signed-in email in the nav, which costs a request on every page.
- `/api/me` answers `null` when signed out. Rejected: a 401, which logged a console error on every signed-out visit to /batch.
- /batch holds its sample files until the account call finishes, so the request counter never counts that call.
- Billing: Lemon Squeezy buy links, with `checkout[custom][email]` set to the signed-in address. A webhook maps variant to plan. Statuses active, on_trial, past_due and cancelled (until `ends_at`) keep the plan; anything else drops to Free. Rejected: the Checkouts API, which needs a secret in the Worker for no gain.
- API keys: `fs_live_` plus 40 hex characters, shown once, stored as SHA-256, ten per account, revoked by deleting the hash. Rejected: the reversible storage main used for trial keys.
- Team: the owner adds up to four email addresses. Members get the Team plan, the owner's policy and the owner's API quota; they cannot change the policy.
- Batch gating is client-side. The files never reach the server, so there is nothing to gate there, and the code is MIT-licensed, so anyone can bypass it. Paid plans sell convenience, and the FAQ says so. Rejected: server-side gating, which would mean uploading the files.
- Signed reports (Ed25519, from main's cloud Worker) are for Team and API only.
- The hosted API is at `/api/v1/*` on the same host. Rejected: a subdomain.
- Contact: email and GitHub, no form. Rejected: a form, which needs Turnstile plus delivery for little gain. Only hello@filesanity.com is shown, because it is the one mailbox known to be live. Security reports go there with "Security" in the subject. Rejected: security@, which may not exist.
- Pages: the brief's list plus /batch, /developers, /sign-in and /account. Not ported from v2: /formats (split into /photos, /documents, /pdf), /blog, /changelog, /cli, /extension, /source. The CLI and the extension still exist on main.
- Social image: the home hero at 1200x630, captured from the page. Rejected: a generated card.

### Design calls
- The hero is J as the owner saw it: the headline top-left over a muted lede, two buttons, the tray at right. These are House tells: a two-line headline over a muted grey sub-paragraph, a tracked variable grotesk, left text with a right asset, one filled plus one ghost button. Reason: the owner picked this exact composition out of 16 directions. Rejected: changing the picked hero after the pick.
- Headline: two lines at 1366 and 1917 (84px max, copy column 7fr). On phones under 600px it drops to normal width at 32 to 43px. After critic round 1 (tray stacking) and the shorter lede: two lines at every phone size and the button above the fold at all six, 667x375 included.
- One real image on the whole site: the sample photo on home, next to the four things it gives away. Rejected: generated stills on the inner pages. The read is trust-first and the working tool is the visual.
- The giant lime "0" names the proof: network requests while your file is cleaned. Rejected: a request-counter animation, which would be motion at MOTION 3.
- Inner pages use the Block layout: heading in the left third, body in the right two thirds, one rule above. These pages are prose, so this is the reading layout. Rejected: cards for prose.
- Pricing: four plan cards, Pro outlined in lime, buttons aligned at the foot. Rejected: a taller middle tower (a tell). The comparison table stacks below 768px, each value labelled with its plan.
- Uppercase tracked buttons, from J. Logged as a tell, kept because the owner picked them.
- Footer: a brand line and three link columns. Rejected: four columns (a link farm) and a one-row footer (the House tell).
- Radius: 6px everywhere, and the round-2 batch window is forced to it. Rejected: its 14px window with pill buttons, which mixes the radius system.
- The batch window and the account panels are cream sheets with their own light palette; their action colour is the forest. Rejected: dark panels on the green, where the window's table loses contrast.
- Account UI is app UI, out of the studio layer's scope. Built from a named product reference: Linear's settings, one column of groups, each a heading, one line of description and its control. Rejected: a dashboard with a sidebar (a tell, and only four groups).
- The nav folds into a solid sheet under the bar below 960px, scrolls inside itself, and is checked at 667x375. Rejected: a see-through overlay.

### Checks
- `tools/saas_check.mjs` (16 checks against `wrangler dev`): sign-in needs Origin and Turnstile; the link works once; the cookie flags; cross-origin calls are refused; the key is shown once and its hash is never returned; a free key cleans and counts; unknown and revoked keys are refused; a bad webhook signature is refused; the webhook moves the plan; the signed report verifies and matches the clean file; Team seats, inherited policy and removal; expiry drops to Free; sign-out.
- `tools/site_check.py`: 17 routes at 1917x870, 1366x650 and the six-size phone matrix, in Firefox and Chromium:
  - no horizontal scroll, no console errors, a one-line nav at desktop;
  - the phone menu opens solid and stays in the viewport;
  - the home cleaner: sample, clean, zero requests during the clean, a counter at 0, and output without GPS, Artist or City;
  - batch signed out: the sample files load, the counter stays at 0, and the "needs Pro" gate shows.

  All pass.
- Budget: JS 99.7 kB gzipped (one bundle for every page), CSS 6.6 kB, the home image 130 kB AVIF lazy-loaded below the fold. The LCP candidate is the headline text.

### Critic round 1 (FAIL, 3 items), fixed
1. The hero never stacked on phones. My desktop column override in site.css came after j.css's 1023px single-column rule and beat it, so the tray was 107 to 152px wide on every phone. It is now inside `@media (min-width: 1024px)`. My own fold measurement checked only the button's position, not the tray's width. That is a check to add to the harvest.
2. The home lede was 27 words against a cap of 20. It is now 19: "Photos and documents carry who made them, where and when. FileSanity removes that in your browser. Nothing is uploaded."
3. One scheme, logged: the site ships dark-on-forest only (`color-scheme: dark` on `.jv-1`), with no light variant. The forest ground on every page is the risk, and a light scheme would remove it on every visitor's light-mode machine. Rejected: a light variant (J5 sage was that variant, and the owner did not pick it).

### Critic round 2: PASS (Q1 to Q6 and the mechanical checks)
Critic caption (Q1): "A product site poured in deep forest green, where the file picker is a cream index card tilted on the green beside a two-line cream headline, and halfway down a lime "0" the height of three lines counts the network requests made while your file is cleaned."
Open: the Turnstile test widget on /sign-in has focusable DIVs with no visible ring. They are third-party; recheck them with the live keys.

## Logo options (2026-10-08)
Owner: "check how peters design company does the logo first learn from it". That is Allan Peters' studio (petersdesigncompany.com, *Logos That Last*). I studied the logos page and his Dribbble. What his work does:
- One mark fuses two ideas: Firecraft (a flame and a pizza slice), Cartwheel (the Target bullseye as the cart), 60 Moto (a bike chain as the frame), Threshold (a key as the O), Gatorade (a G and a bolt).
- Bold geometry: even, heavy strokes, round terminals, built from circles and straight lines.
- One or two flat colours, reversed out of a full colour field.
- It works in one colour.
- The mark expands into a system: badges, a symbol with a wordmark.
- Redesigns remove detail: the Gatorade G with its bolt.
- Ideas come first and the software second; he presents several concepts.

The four options in `assets-src/logo/`, compared on `shots/logo-options.png` (`tools/logo_sheet.py`):
- A Zero: a file and the 0, the proof.
- B Says too much: a file and a speech tail.
- C Cut tag: a file and a cut luggage tag.
- D Three lines: concentric outlines, the Peters line motif.

Recommended: A. Rejected:
- B: chat-and-document icons are common (comment and notes apps).
- C: the tag turns to mush at 16px.
- D: reads as "layers" or "stack", not "clean".

Drawn by hand as vectors. Rejected: generated logos, which come out raster and are hard to trademark. The wordmark is still typed Archivo; drawing it is the next step after the pick.

### Logo, D developed (2026-10-08)
Owner: "leaning towards D". They asked whether D is how Peters works, and to research and run several rounds of trial and error.

Study of his line marks (Coresound, Greenway G, USA, Heartland, his own P; crops in `refs/logo/lines-zoom.png`). Four rules, and the first D broke all four:
- Lines are open and end in flat cuts on one edge.
- Line width equals gap width.
- The lines draw a letter.
- A second idea is fused in.

Rounds (`tools/logo_lab.py`, sheets `shots/logo-lab-*.png`):
1. Eight concepts. The generator's rhythm was wrong (five thin, uneven lines). The S file and the F file were strongest; the closed outline, the open side, the missing corner and the stripes read as stray letters or stock icons.
2. Rhythm fixed (stroke stack (2n-1)s, (2n-3)s ...). The S reads as an S at every size, but the file reads weakly. Lime as a line disappears on cream.
3. The folded-away corner added as a solid lime flap, the part removed. File plus S now read at once. Remaining faults: the bottom end was not flush, and lime on cream is below 3:1.
4. Bottom end cut flush with the stem's outer edge. On cream the flap is forest. Square turns chosen to match the square flap. Rejected: round turns, which mix a round line with a sharp flap.
5 and 6. Real-pixel test: three lines turn grey at 16 px. A size system:
   - three lines at 48 px and up;
   - two lines from 24 to 48 px;
   - one solid line at 16 px.

   Peters extends a mark into a system the same way.

Recommended: 4a, 4c and 6a, the S file. Open: the 16 px flap needs enlarging (its offset formula leaves it tiny at n=1); the wordmark is still typed Archivo; a trademark search on the mark.

### Logo, A developed for a fair comparison (2026-10-08)
Owner asked what would have happened without the D lean, then said yes to a fair round on A (my first recommendation).
- A round 1 (`shots/logo-lab-a.png`): A2 to A5 make the whole file a bold 0. Square or rounded-square counters stop reading as zero; at 16 px they read as a SIM card or a door.
- A round 2 (`shots/logo-lab-a2.png`): a tall oval counter. A6 (round body, oval counter, corner set apart in lime) reads as zero and as a file, at every size, as one shape.
- Side by side (`shots/logo-compare.png`): A6 against the S file (4a, 4c, 6a).

Recommendation changed to A6. It is one solid shape that needs no size system, it carries the product's one fixed idea (zero requests, nothing hidden), and it is calmer, which answers the owner's first-round "not professional enough". Rejected: the S file, which is more crafted and carries the name, but is busier and needs three versions. It stays the alternative if the owner wants the line style.
- Owner: "okay proceed to your recommendation". A6 is the logo.
  - Files:
    - `public/brand/` has `mark-on-forest`, `mark-on-light`, `mark-black` and `mark-white` SVGs.
    - `public/favicon.svg` is the mark on a forest rounded square.
    - The icons are 192, 512 and maskable 512 PNGs. The apple-touch icon is full-bleed, because iOS rounds the corners itself.
  - In the nav and footer, the `Logo` component is an inline SVG with `aria-hidden`; the name stays text.
  - The social image is regenerated with the lockup.
  - Below 400px the lockup and buttons tighten so the bar fits at 320. Adding the mark had overflowed it by 18px in Chromium; `site_check` caught it.
- Wordmark: kept as Archivo 112% text, not redrawn. Rejected: hand-drawn letterforms. A drawn wordmark is type design, and done here it would look worse than Archivo, which is already the site's display face. A redraw is a job for a type designer if the brand grows.

## Professional pass (2026-10-09, owner: "the hero is tilted, which makes it not serious"; "in zoom the horizontal lines look weird"; "mobile menu feels basic")
- Hero tray straight; the -2.5deg tilt dropped. Rejected: a smaller tilt (still reads as a toy next to a security claim). The risk (one forest on every section, tools as cream sheets) is untouched.
- Tray shadow tightened to a 1px contact plus a soft 16/40 drop. Rejected: no shadow (the cream sheet loses its lift on the forest).
- Empty tray shows a dashed drop target (#8a8470, 3.3:1 on cream), lime-tinted while a file is held over it. Rejected: an upload icon (no icon family in this build; the dashed edge alone says "drop here").
- Section rules span the content column (a background line sized to the wrap), not the window. Rejected: removing the rules (the single-colour page loses its section breaks).
- Phone menu: a full-height sheet, the pages in Archivo wide at 1.5 to 2rem with arrows, the current page in lime with a dot, a short stagger (off under reduced motion), page scroll locked, Escape closes, a burger that turns into an X, and FAQ/About/Contact/mail under the list. Rejected: a slide-in drawer (a second surface colour on a one-colour site).
- Bicycle section aligned to the top. Rejected: centred (the photo floated mid-column under the headline).
- The proof "0" is cream at 6 to 11rem (was lime at 9 to 20rem, the loudest thing on the page). Lime stays for actions only, as on the bicycle values. Rejected: removing the zero (it is the proof the section names).

## Extension (v3) (2026-10-09)
Product calls from the owner's brief, then build calls; each with what was rejected.
- Free core: auto-clean on upload everywhere, counts, per-site pause, popup drop zone. Rejected: gating any single-file clean (the site promises one file is never paywalled).
- Subscriber extras: saved policy on upload, per-site rules (always / never / ask), "Save without metadata" on images, a local log of 100. Rejected: a server-side log (the extension sends no file data anywhere).
- Pairing reuses the API-key machinery: `POST /api/keys { scope: 'ext' }` mints `fs_ext_<40 hex>`, hashed in KV under the same `key:` prefix, listed and revoked like keys. Rejected: a separate token store (a second revoke path to keep correct).
- Extension tokens and API keys are kept apart by prefix: the hosted API takes `fs_live_` only, `/api/ext/me` takes `fs_ext_` only. Rejected: one key for both (a leaked extension token would spend API quota).
- `GET /api/ext/me` answers `{ plan, policy }` and nothing else, with `Access-Control-Allow-Origin: *` (bearer, no cookie). Rejected: relying on the host permission alone (Firefox lets users decline host permissions).
- The account page lists extension tokens in their own panel and hides them from the API-key table. Rejected: one mixed table (an "fs_ext" row reads like a broken API key).
- Uploads keep the original file name. Rejected: v2's "-clean" suffix on upload (it tells the recipient the file was scrubbed); downloads from the popup and the menu still get "-clean".
- Drops are held and replayed as a synthetic drop with the clean files; a drop onto a file input fills the input. Rejected: leaving drops uncovered as v2 did (the brief names drag-drop).
- The "ask" rule uses `confirm()`. Rejected: an injected dialog (page CSS and focus traps to fight on every site, for one yes/no).
- "Save without metadata" cleans in the content script (fetch from the page) and saves through `downloads` (data URL in Chrome's worker, blob URL in Firefox). Rejected: fetching in the background (needs host permission on every site, which the brief rules out). Limit: cross-origin images without CORS are refused with a message.
- Per-tab counts in `storage.session` with the toolbar badge; today's count in `storage.local`. Rejected: the `tabs` permission (the popup asks the page's content script for its host instead).
- Firefox popup "Choose a file" opens the panel in a tab. Rejected: the picker in the popup (Firefox closes the popup when the dialog opens).
- Build: `scripts/build-extension.mjs` with the esbuild already installed by vite and wrangler (0.28, no new dependency); `zip` CLI, else `src/lib/zip.ts` zipStore. Rejected: a vite multi-entry build (vite 8 is rolldown, and the content script must be one IIFE file).
- One manifest; the build drops `browser_specific_settings` for Chrome and swaps `background.service_worker` for `background.scripts` for Firefox. Rejected: two hand-kept manifests.
- Popup and options are plain DOM and TypeScript, no React (popup.js 29 kB minified, mostly the parsers). Rejected: React (adds about 60 kB to a 320px panel).
- Archivo (latin, width axis, 90 kB) ships inside the package for the headings at 112%. Rejected: system font only (loses the J1 wordmark); the cost is package size, not network.
- Icons 16/32/48/128 resized once from `public/icons/icon-512.png` into `extension/icons/`. Rejected: resizing in the build (needs an image library).
- `/extension` page: install buttons go to the GitHub releases page with "Store listings pending review" shown beside them. Rejected: store badges (the listings do not exist; no ratings or counts invented).
- Version 3.0.0. Rejected: continuing v2's 1.1.0 (v3 is a rewrite with paid features).
- Firefox cleans in the background page: a content script sees the page's File through a realm wrapper the parsers cannot await through, so content.ts sends the File to the background (Firefox clones Files in messages) and hands the clean copy, DataTransfer and replayed drop back in the page's realm (`cloneInto`, `wrappedJSObject`). Chrome cleans in the content script as before. Rejected: wrapping every DOM promise in src/lib (calling `.then` on the page's promise is refused too) and a Firefox-only parser build.
- Pastes that carry files are cleaned and replayed with their text, in Chrome. Not in Firefox, which empties a constructed paste event's clipboard; there the original paste goes through. Rejected: swallowing the paste in Firefox (the visitor's paste would vanish).
- Replays are marked by a synchronous flag around dispatchEvent. Rejected: an expando on the event (invisible across Firefox's wrappers, which would loop).
- ext_check runs both engines, pairs for real against the local Worker, and checks "Save without metadata" plus its download (Chromium) and its reply (Firefox). Firefox loads the add-on over the remote debugging protocol (tools/rdp.py). Rejected: web-ext as a dependency for one call.

## Guides (2026-10-09, owner delegated; now in scope)
- A /guides section: an index and six how-to guides, prerendered like every route, each with its own title, description, Article plus BreadcrumbList JSON-LD (Home > Guides > guide), in the sitemap. Rejected: a dated blog (how-to pages stay true without a publishing cadence; a blog with no posts for months reads as abandoned, and CLAUDE.md keeps a blog out of scope).
- Six guides chosen by what the audience searches before sending a file: location in photos (sellers, journalists), author and company in Office files (lawyers, HR, freelancers), PDF metadata, what a photo carries (field names), what Marketplace and eBay keep, and checking a file is clean. Rejected: one guide per audience ("metadata for lawyers"), which repeats the same steps six times.
- Each guide gives the manual way first, cited inline to the vendor page, and says when the OS or Office setting alone is enough; FileSanity is one block near the end with the one "Clean a file" button to /#cleaner. Rejected: FileSanity first (reads as an ad, and Document Inspector genuinely does more for Office content).
- The marketplace guide says what Meta's and eBay's own policies state (they collect metadata) and that neither publishes what buyers can see; per-platform strip/keep tables were rejected because no platform documents them and third-party tests disagree.
- Windows "Remove Properties and Personal Information" left out: no Microsoft page found to cite. Firefox's PDF properties panel left out for the same reason.
- Article schema, not HowTo. Rejected: HowTo on the step guides (Google dropped HowTo rich results; one schema type keeps prerender to one branch).
- Guide content lives in one module (src/site/pages/Guides.tsx), routes generated from its list. Rejected: one file per guide (six copies of the same wrapper). Cost: +12.6 kB gzipped JS (99.7 to 112.3 of 150), since every page's bundle carries the copy. Rejected: a lazy chunk per guide (needs async hydration the site does not have yet); revisit if JS passes 130 kB.
- Index is a table of contents: hairline rows, the title in Archivo wide, the description in muted ink. Rejected: cards (studio identity groups by rule and space).
- "Guides" added to the footer Files column; the nav stays as is. Each format page gets one "Doing it by hand" line linking its guide(s).
- Menu paths carry a "Checked 9 October 2026" block, since vendor menus move between versions.
- Guide pages ship as static HTML: the client keeps the prerendered text (an empty dangerouslySetInnerHTML wrapper) instead of bundling it, so JS is 103 kB not 112. Rejected: lazy import plus Suspense (renderToString cannot wait for it).

## Sample photo (2026-10-09, owner pick)
- Sample is now white sneakers inside an open front door, gate and street behind (Codex still A), not the bicycle on a stone wall; rejected B (laptop on a table, read as a brand product) and C (bicycle at the gate, the same subject the owner disliked). Why: the owner found the bike unrelated; a listing photo taken at home makes the GPS risk literal.
- Invented metadata moved from Oxford to Quezon City (14.6760 N, 121.0437 E, +08:00), author R. Villanueva; rejected keeping Oxford, which contradicts a Philippine house in the frame. Field count stays 52.
- Sign-in email has an HTML part in J1 colours (forest field, cream sheet, forest button, lime 'Sanity'), text part kept; rejected an image logo, which Gmail blocks by default and which would be a fetch from our server on open.
- Tutorial video (video/, HyperFrames) removed at the owner's request; it showed the old bicycle sample. Batch samples now come from make_samples.py (shoes.jpg replaces the stale bicycle.jpg, which still carried the Oxford metadata).
- Deploy before Lemon Squeezy (owner asked): paid checkout links are empty and /account says 'Opens soon' instead of linking a broken checkout; rejected waiting for activation, since Lemon Squeezy reviews the live site, and rejected hiding the paid plans, which the review wants to see.
- Nav "Clean a file" hides while the page's own CTA (hero, closing) is on screen (owner: two at once "looks redundant"); rejected removing the closing button, which leaves the last section without its action on phones where the bar's button is small.
- Footer "authegg" links to https://authegg.com in a new tab (owner asked).
- Removed src/shared/Shell.tsx and ProductPage.tsx: direction-gate leftovers nothing imported.
- Home "what it tells" section is a Photo · Word · PDF switch (owner asked for more examples), each with real fields from its sample and its own "Open it in the cleaner"; documents are drawn as a cream page in HTML. Rejected: generated photos of documents (a picture of a page reads as stock), real tabs with arrow-key roving (a three-button group with aria-pressed is simpler and fully keyboard-usable), and trimming "What each kind of file gives away", which still links the format pages and covers Excel, PowerPoint and PNG.
- Selected example is cream, not lime: picking an example is not the action.
- Critic round 1 fixes (2026-10-09): pricing cards share rows through subgrid (tells.md "lists at different heights"); hero top-aligned so the copy does not jump when the tray grows; tray fields grouped under Where/Who/When/On what headings like /batch, coordinates unwrapped; after a clean the tray lists what was removed by group instead of blank space; document examples show their real first lines and file name instead of grey bars (read as a skeleton loader); /developers "Placeholders until confirmed." removed; section padding 120 to 96px max, and the last FAQ and format-table rows drop their border where a section rule follows; the Free card's "Clean a file" hides the nav one too; captions "Real fields, invented values."; the samples footnote only on / and /batch; Free shows "$0 a month"; /batch policy formats sit under each label; /pricing comparison columns are equal (table-layout fixed).
- Logged tell: spec and FAQ rows ruled top and bottom are kept on purpose (are.na, hairlines only); the last row's rule is dropped where a section rule follows.
- Critic round 2 fixes (2026-10-09): skip link readable (forest on cream); scrolls to the cleaner respect reduced motion; step circles and the /developers callout rule no longer lime (accent on actions only); /batch field list fills its pane to the foot and scrolls itself; signed-report snippet re-broken to fit; steps (6rem gap), proof (4fr|8fr, 3rem) and FAQ share one second-column edge at every width; the Photo/Word/PDF examples are stacked in one cell so switching never changes height; nav "Account" spacing equal to the others; format table cells baseline-aligned.
- Sample company "Northwind" (Microsoft's demo name, a placeholder tell) replaced by the invented "Tamarind Freight". Rejected: a real Philippine company name.
- Anchor served: are.na (anchor 3), hairline-ruled blocks with headings left and content blocks as the layout. The anchor 2 claim is withdrawn: with the tilt gone, the motion is a drop state and the menu stagger, not springs with mass.
- Primary buttons inside cream tools (tray, batch window, sign-in) are forest, not lime: lime on cream fails contrast, so on a cream sheet the action takes the page's colour. Pro's highlight outline is cream, not lime (accent on actions only). Critic round 3: PASS on Q1-Q6.
- Sample section is direction D (owner pick from A–D after "feels off"): no photo and no drawn pages; the three supported kinds are the logo's file shape set with JPG, DOCX, PDF, and they are the switch, beside a consequence headline and the four leaked fields. Rejected: A (three text columns, no story), B (before/after table, a list again), C (photo plus drawn street plan; the documents had no matching visual and read as blank pages). The chosen file's corner is lime: it is a control's state and the logo's own corner.
- Sample documents now carry real content (an offer letter; a fee summary whose hidden title is still "Internal memo"), kept free of the metadata's names; tests/lib.py checks Office leaks in docProps only, since a letterhead is content, not metadata. The shoes AVIF variants are deleted (unused); sample.jpg stays as the photo sample.
- Watermark removal declined (owner asked): visible marks are copyright information, invisible AI marks exist for disclosure, it would change the picture, which the product promises not to do, and it needs a model far over the JS budget.
- C2PA Content Credentials (owner asked): JPEG APP11 JUMBF stores that contain "c2pa" and PNG caBX chunks are listed and removed by default; Pro can keep them with the new "c2pa" policy key. Fields: the generator, the signer (the signing certificate's organisation), the IPTC digital source type ("Made by AI"), edit actions, ingredient count, the record's size. Read by scanning for CBOR keys (src/lib/c2pa.ts, ponytail note there), not a full CBOR/COSE decode; rejected: shipping a CBOR+X.509 library (size budget) and validating signatures (not the cleaner's job). Other APP11 JUMBF (JPEG XT, 360) is image data and stays. Not in PDF or Office (C2PA there is rare and embedded differently). Fixture: CA.jpg from contentauth/c2pa-rs (MIT/Apache-2.0) as tests/files/c2pa.jpg, plus a PNG built from its store.
- Memo sample's XMP now reads as a memo's (author, Word, fees keywords) instead of the photo's; its count is 25 fields.
- Nav CTA starts hidden on / (useState(path === '/')): the prerendered page showed it, then hid it on hydration (owner saw the flash). Rejected: CSS scroll-driven timelines (no Firefox support). A reload mid-page on / now shows the button a moment late instead of early.
- 2026-10-09 live sign-in check: the owner passed Turnstile and requested a link; the email reached the Gmail inbox from signin@filesanity.com; the link opened /account (fs_s cookie HttpOnly, Secure, SameSite=Lax), a second use went to /sign-in?expired=1, and sign-out worked. Turnstile refused a headless browser outright. The Before deploy list is complete apart from Lemon Squeezy.
- HEIC (owner asked, 2026-10-10): src/lib/heic.ts reads the HEIF meta box (iinf, iloc, idat) and blanks the Exif and XMP items in place, same length: an empty TIFF header for Exif, a space-padded empty packet for XMP. Rejected: rewriting meta/iloc to drop the items (box offsets shift; the bytes would still sit orphaned in mdat) and decoding/re-encoding (changes the picture, needs a codec). Orientation in HEIF is the irot/imir property, not Exif, so nothing turns. AVIF shares the container and is read too, not advertised. Tested on a pillow-heif fixture with the photo's full EXIF/XMP and three third-party HEICs (pixels identical after the clean). Not tested on a real iPhone file with GPS; the owner can check one locally.
- Lemon Squeezy (2026-10-10): store 493606 "FileSanity" (filesanity.lemonsqueezy.com). Webhook 141121 created by API in test mode for the 11 subscription_* events; the signing secret was rotated to 40 hex characters (Lemon Squeezy's limit) in .prod.vars and the Worker secret. The API key is in .ls-api-key (gitignored, 600). Products cannot be created by API; the owner makes them in the dashboard. A live-mode webhook is needed once the store is activated.

## Lemon Squeezy products (2026-10-10)
- Three products, one default variant each (Pro 2229415, Team 2229436, API 2229440), owner-made in the dashboard since the API cannot create products. Rejected: one product with three variants, because each plan needs its own description and tax category (Pro personal-use SaaS, Team and API business-use).
- Storefront display off: a purchase from /account carries the signed-in email as custom data; a storefront purchase would only carry whatever email the buyer types.
- Account loading state is a skeleton of the signed-in layout (real headings, pulsing bars, reduced-motion static) instead of a 'Loading your account' line. Rejected: a spinner, because it still swaps for a different layout. (2026-10-10)
