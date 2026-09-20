# Decisions

One line per autonomous call: what was chosen, what was rejected, why.
The rejected alternative is the part that matters.

Format: `- [date] chose X over Y because Z`

# v2, 2026-09-20: the professional multi-page site

## Client environment

Firefox at 1917x870 primary; phone 390x844; also 1366x650. Verified in
Firefox (home fold and full at 1917x870 and 390x844, the six picker
states, the phone menu, the tests' Firefox pass) and Chromium (1366x650,
390x844, the vitals run, widths, keyboard, reduced motion, contrast, the
per-page shots at 1440).

## The client's verdict on v1, taken literally

"What is this? Looks not professional and a scam site. Let's do it
professionally, complete all pages, and make sure the file picker is not
using the native one." Three instructions, each a fixed requirement:
professional register (trusted product company), every page, a custom
picker. v1's manual/typewriter register, metacleaner's own page and the
padlock-and-shield privacy template are the anti-anchors.

## Ledger read (SHIPPED.md, last three rows)

- lab-g-blath: geometric sans, warm paper with no accent, space and
  photographs, 7/5 split, colour-block closer, backlit stills, light and
  dark.
- lab-h-press: serif display, cotton card and ink with one red, shoulder
  notes and a docket, sprite stage, proof-docket closer, keyed sprites,
  light and dark.
- lab-i-dental: signage sans, cool green ground with coral, drawing-sheet
  fields with notched labels, pinned stage, chart-entry closer, keyed
  molar, light and dark.

Shared by all three: light and dark by token flip; a working object
beside copy in the hero; generated photographs. This build keeps the
working object (the client fixes it: the hero is the picker) and
generated stills (three abstract product stills, the only way to get
photographs with no people and no stock tells), and drops dual mode: it
ships one scheme, light only, because the archetype the client's skill
names, white panels floating on a silver ground, is an elevation system
that does not invert; a dark version would be the vantablack-card glass
page the studio names as anti-anchor one. Logged as the rejected
alternative below.

## Reference pass

Step 1. `get_filters` run 2026-09-20: 11 styles, 24 industries, 19
macrostructures. Seven searches, each result's hero capture downloaded
and looked at, not read from the autopsy text:

1. "fintech trust page, light ground, large grotesk, soft shadows,
   floating cards", industry fintech, light: aave-com--about,
   heyclicky-com--trust, step-com, mollie-com--pricing,
   azure-microsoft-com, deel-com, mercury-com, public-com, stripe-com,
   classcreator-io.
2. "privacy first developer tool, light page, the product working in the
   hero", developer-tools, minimalism, light: tavus-io, forestadmin-com,
   polar-sh, together-ai, cyphr-studio, headroom-com,
   generalintelligencecompany-com--writing, minimal-so, mintlify-com,
   ethereum-org.
3. "password manager or encrypted mail, trust register, light, calm, no
   illustration", saas, swiss, light: brunocis-co, nogood-studio--work,
   kononenkogroup-com--work, bymonolog-com--work, deno-com,
   nanorcollection-com, ohnotype-co, works-studio, aristidebenoist-com,
   normarchitects-com. Semantic search does not know the password
   managers; junk for this brief.
4. "drag and drop a file into the hero, the tool is the page, upload
   zone": cyphr-studio, mage-ai, clay-com, unkey-com, milanote-com,
   synthesis-partners--team-and-culture, generalintelligencecompany-com,
   diffusion-studio, gehry-getty-edu, forestadmin-com.
5. "consumer privacy app, white background, soft ambient shadows,
   floating device", consumer-tech, light: tempo-fit, bowerswilkins-com,
   copilot-microsoft-com, fellowproducts-com, signal-org, snap-com,
   whoop-com, classcreator-io, flatfile-io, makingsoftware-com.
6. "end-to-end encrypted, your data stays on your device, privacy
   product, calm light": becomeautonomous-com, aerotime-com, qonto-com,
   canvasapp-com, forestadmin-com, joindawn-com, designmaestro-io,
   furoweb-eu, motherduck-com, mem-ai, bennettandclive-com, flatfile-io.
7. "paper band light product page, large grotesk headline, one pill
   button, the app in a soft framed window", swiss, light:
   lookback-com--pricing, arc-net, parachutehome-com, flomoapp-com,
   forestadmin-com, headroom-com, tavus-io, amie-so--pricing,
   anytype-io--pricing, azure-microsoft-com, capacities-io--pricing,
   cleanshot-com--pricing.

Slugs tried directly: linear-app, vercel-com, stripe-com, resend-com
exist; 1password, proton, tailscale, bitwarden do not.

Hero captures downloaded and looked at (22, one contact sheet):
anytype-io--pricing, arc-net, becomeautonomous-com, canvasapp-com,
clay-com, cleanshot-com--pricing, copilot-microsoft-com, deno-com,
flatfile-io, linear-app, mem-ai, mercury-com, minimal-so, mintlify-com,
mollie-com--pricing, polar-sh, public-com, resend-com, signal-org,
stripe-com, uploadcare-com, vercel-com. Full pages looked at at 300px
wide (6): minimal-so, polar-sh, copilot-microsoft-com,
mollie-com--pricing, signal-org, public-com.

What the captures showed that the text did not: linear, resend and
vercel are dark or gradient heroes, the register the studio names as
anti-anchor one; stripe's hero is a chromatic gradient. The calm-trust
mechanisms sat in three light pages: minimal-so (headline top-left, one
black pill, the working product in a hairline-framed window as the
first screen), mollie-com--pricing (a warm silver band holding two
white rounded cards with almost no shadow, one dark filled pill, a
78px light headline, a mono-caps eyebrow), copilot-microsoft-com (the
input field is the hero; nothing else on the page). signal-org is
illustration-led and blue, the padlock register in cartoon form; public
is serif and dark-banded.

Step 2. Anchors.

- Structure and pace: **minimal-so**, https://minimal.so, saas
  (index-first). Mechanism: the page is the product; a short headline
  with one sentence and one black pill, then the working tool in a
  framed white window on the first screen, then plain two-column text
  pairs under hairlines, then pricing as two columns. Taking: the tool
  as the first screen; text pairs under hairlines for the sections
  outside the panels; pricing as columns without towers. Leaving: the
  black pill (ours is the accent), the yellow, the sign-in nav.
- Surface: **mollie-com--pricing**, https://www.mollie.com/pricing,
  fintech. Mechanism: white panels resting on a warm silver band with
  hairline edges and a barely-there shadow; one large light-weight
  grotesk headline with tight tracking; a mono-caps eyebrow; one
  espresso filled pill and one tinted ghost pill; a long rate table on
  hairlines. Taking: silver ground with white plates; the eyebrow pill;
  the filled pill plus ghost pill pair; hairline rows for tables.
  Leaving: the espresso (ours is oxblood, logged below), Inter (banned by
  the client's skill), the accordion FAQ, the centred pricing headline.
- `get_design_system` on both: mollie reports Inter Variable at 78px/400
  with -2.4px tracking, spacing 32/80, radius 0 (the pills are rounded in
  the capture; the extraction is thin). minimal-so reports Geist
  Variable 48px/600, spacing 8 to 112 on a 4px base, radii 0 to 14,
  container 1440. Taken: Geist; the 4px base; container capped at 1280
  (80rem) so the hero panel's copy column stays under 60ch at 1917;
  radius system: pill on every control, 1.75rem and 2rem on the bezels,
  1rem to 1.25rem inside (a mixed system, written rule: outer radius
  minus padding gives the inner radius, concentric everywhere).

## Read

Read A, the first association, kept.

```
Reading this as: a multi-page product site for a browser-side metadata
cleaner, for people about to send a file to a stranger (journalists,
lawyers, HR, sellers), in the register of a trusted product company:
Soft Structuralism, a silver-grey ground with white panels floating on
diffused shadows, one large clean grotesk, pill controls, serving
minimal-so for structure and mollie-com--pricing for surface (studio
anchor 3 for the grouping by rule and space outside the panels).
MOTION 5: the tool is the motion: the table is drawn from the visitor's
file and the figures recompute on clean; beyond that, entrances on view,
a pill whose icon moves on hover, the phone menu's stagger, nothing
driven by scroll.
RISK: the first screen is the drop tray. One white double-bezel panel
fills the fold below the floating nav; the headline, the sub-line and
the one pill sit inside its top-left corner and the picker at its right,
and a file dropped anywhere on the panel, headline included, is read.
There is no page around the tool until you scroll.
COST: if the panel reads as a hero card and not a target, a visitor with
a file in hand looks for an upload box, finds the dashed area late or not
at all, and leaves; a template would set the headline on the page and
the dropzone in a card beside it. Rejected larger risk: opening with the
sample already read, a stranger's GPS, name and camera serial as the
first thing on the page; rejected because it fetches on load, pre-empts
the idle state the client asked for, and a page of someone's personal
data reads as a leak, not a cleaner.
SEEN: a silver page with a small white pill at the top; under it one
big white rounded panel filling the first screen, a two-line headline in
its top-left with one oxblood pill and a dashed rectangle at its right;
below, three white tiles of unequal width, two with a photograph of
paper, a short numbered list, a six-row table, a glass block beside a
paragraph, and a white band at the foot with the same pill.
NEW: grouping by elevation: white panels on a silver ground with
diffused, tinted shadows and a detached floating nav pill (lab-g space
and photographs, lab-h shoulder notes and a docket, lab-i drawing-sheet
fields); one colour scheme, light only (all three ship light and dark);
pill radius on every control.
GREP: tray, panel, drop target, fold, hero as the tool, headline inside,
dropzone, double-bezel, first screen.
MOTION: the table of fields is drawn from the visitor's own file, the
count in the card header and the pill label are computed from it, and
cleaning strikes the rows through and writes the before and after sizes
and counts; the request counter beside the result reads the page's own
network record since the read.
```

Read B, the counter-read, rejected in one line: serving anchor 2
(rauno.me) and polar-sh, an Editorial Split with a large quiet headline
on the left half and a staggered stack of three file chips on the right,
each turning on hover to show what it leaks, the tool below the fold;
rejected because the client fixes the hero as the working picker, and a
hover demonstration does not exist on the phone.

## Log

- [2026-09-20] chose Soft Structuralism (skill archetype A3) over
  Ethereal Glass (A1, the dark mesh and glow the studio names as
  anti-anchor one) and Editorial Luxury (A2, cream and serif, a
  lifestyle register for a tool that lawyers use).
- [2026-09-20] chose the Editorial Split inside the hero panel (copy
  left, the working picker right) and an Asymmetrical Bento for the
  "what a file carries" section over the Z-Axis Cascade (rotated
  overlapping cards read as playful, not trusted).
- [2026-09-20] chose Geist Variable, one family for display and body,
  over Plus Jakarta Sans (rounded terminals, consumer-app register),
  Manrope (geometric, startup register), Onest (less tested at display
  size, weaker tabular figures) and Instrument Sans (no weight below
  400, uneven at 3.5rem); Geist has tabular figures for the table and a
  29 kB Latin variable file. Inter, Roboto, Arial, Helvetica banned by
  the client's skill. Latin subset only, self-hosted from Fontsource's
  file, preloaded, with a metric-matched Arial fallback (size-adjust
  104%, ascent 96%, descent 28%) measured to move the phone fold by 0px
  when the font request is aborted. No mono anywhere: the table's
  values are Geist with tabular figures, because the typewriter register
  is the client's anti-anchor.
- [2026-09-20] chose Phosphor at weight light for every icon (arrow in
  the pill's orb, the drop arrow, the file glyphs on the chip, the
  warning, the check) over Phosphor thin (too faint at 14px on the
  oxblood pill) and over Lucide (the skill bans it).
- [2026-09-20] chose the accent oxblood (#8c2f2a, saturation 70%), the
  pen a document is struck through with, used identically as the CTA
  fill, links, focus rings, the "Coming soon" tint and the strike
  through removed rows, over ink-black pills (Vercel; leaves a page with
  no accent), blue (metacleaner), green (the shield-and-tick register),
  orange (v1) and Mollie's espresso (borrowed, not from this brief).
- [2026-09-20] chose a silver ground (#f1f1ef) with white plates
  (#fdfdfc) over a white page with grey cards because the archetype's
  elevation reads only when the ground is darker than the panel; House
  "cold off-white paper" noticed and logged: the ground here is a
  grouping device (the plate is the panel), not paper.
- [2026-09-20] chose light only over light and dark (all three ledger
  rows ship both; v1 shipped both) because diffused shadows and white
  plates do not invert, and a dark scheme of this archetype is the glass
  anti-anchor; `color-scheme: light` is set so form controls match. The
  ledger's shared property is dropped, not reasoned around.
- [2026-09-20] chose no router library and no client-side navigation:
  every route is prerendered to `dist/<route>/index.html` (and
  `<route>.html` so vite preview and every static host serve the clean
  URL), links are plain anchors, the client hydrates the page for its
  path. Rejected: react-router (about 25 kB gz for pushState navigation
  that prerendered static pages do not need, and a second scroll and
  focus model to manage) and a hand router (state, scroll restoration
  and focus on route change, for nothing). The brief allows React Router
  or multi-entry; this is the multi-entry output with one bundle.
- [2026-09-20] chose one JS bundle for every route (104 kB gz, of which
  React and react-dom are about 65) over per-route code splitting because
  hydration of a prerendered page with a lazy page module means a second
  round trip before the picker works, and the budget is 150 kB per route.
- [2026-09-20] chose CSS transitions on `[data-reveal]` toggled by one
  IntersectionObserver over the `motion` package (30 kB gz to do what
  eight lines of CSS do). The hero panel carries no reveal so the LCP
  element paints at once; reveals are hidden only under `html.js`, set
  by an inline script, so the prerendered page is whole without JS and
  under reduced motion.
- [2026-09-20] chose `cubic-bezier(0.32, 0.72, 0, 1)` from the client's
  skill for entrances and pills, and the studio's (0.16, 1, 0.3, 1) for
  the hamburger; both custom, neither linear nor ease-in-out.
- [2026-09-20] chose the drop surface as a `<button>` that opens the
  picker on click, Enter and Space, with the whole hero section as the
  drag target, over a `<label for=input>` (a label is not a button and
  Space does not fire it in Firefox) and over a `<div role=button>` (a
  real button needs no key handler). The `<input type=file>` is
  `sr-only`, `tabIndex -1`, `aria-hidden`, and is clicked only from the
  custom controls; Playwright's `set_input_files` still reaches it.
- [2026-09-20] chose a drag-enter counter on the hero section over
  `dragover` state on the surface alone because entering a child fires
  `dragleave` on the parent and the ring flickers.
- [2026-09-20] chose paste on `document` reading `clipboardData.files`
  over a focused paste target because Ctrl+V anywhere on the page is what
  the client asked for.
- [2026-09-20] chose to put the field table inside the hero panel, in a
  scroll region capped at 26rem with a sticky head, over a separate
  section below the fold because the client asked for the table inside
  the double-bezel card with the count and the pill, and the panel is
  that card; below 40rem the table stacks each row as a block with the
  part as a group label (the comparison-table exception, stacked, no
  inner scroll).
- [2026-09-20] chose "Remove all and download" for the action on a read
  file, "Download again" and "Clean another" after a clean, as the
  client wrote them, and "Clean a file" for every control that opens
  the picker (nav, hero, closer, the nothing-to-remove state). "Clean
  another" and "Clean a file" share an intent; the client fixed both
  labels, so the studio's one-label rule is overridden here and logged.
- [2026-09-20] chose the nav's "Clean a file" to open the picker on the
  home page and link to `/` elsewhere over mounting the picker on every
  page because a File cannot cross a page load, and a picker on the FAQ
  page would need its own result surface.
- [2026-09-20] chose a floating detached nav pill with a morphing
  two-line hamburger and a full-screen staggered menu on phone, as the
  client's skill prescribes, over the studio's one-line bar; the pill is
  the one fixed element with backdrop-blur, the menu overlay the other.
  Menu: body scroll locked, focus to the first link on open, Escape
  closes and returns focus, links out of the tab order when closed.
- [2026-09-20] chose eyebrow pills on two of the home page's six sections
  (hero, "what a file carries") and one per inner page header over the
  skill's "before every H1/H2", to stay inside the studio's one-per-three
  cap; tells.md "an eyebrow above every section headline" noticed.
- [2026-09-20] chose section rhythm `pt-24` to `pt-32` (6rem to 8rem)
  over the skill's `py-40` because at 870px tall the client would see
  one section per screen and the page would read as empty.
- [2026-09-20] chose the closer as a bezel plate with the statement left
  and the pill right (mollie's "Building a platform?" row) over a centred
  closing statement with the CTA (House tell). The footer is three
  columns of links beside the wordmark, not a four-column link farm
  (tells.md noticed): fourteen pages need a map, and the nav carries six.
- [2026-09-20] chose "Coming soon" as an accent-tinted eyebrow pill on
  Pro and Teams because the client asked for the plans marked so;
  tells.md "pill-shaped New and Beta badges" noticed and logged.
- [2026-09-20] chose the Free plan as one large plate (col-span-7) with
  Pro and Teams stacked beside it over three pricing towers with the
  middle one taller (tells.md), and a check icon per Free line over
  bullets.
- [2026-09-20] chose the FAQ as three groups of four, two columns, all
  open, over an accordion (tells.md) because twelve answers are the page.
- [2026-09-20] chose the formats page as a three-column table above
  768px and a stacked list below, no inner scroll, over `overflow-x`.
- [2026-09-20] chose three Codex stills, one session, one palette and
  light clause (silver #f1f1ef, white, charcoal, one dark red detail,
  diffused light upper left): a print face down (the metadata is on the
  back of a photo), a stack of A4 with a dark red clip, a clear glass
  block on the surface (you can see through it). No people, no padlock,
  no shield. AVIF at 1536 and 768 with srcset; 4 to 17 kB each. Rejected:
  Higgsfield (the brief names Codex), a hero image (the hero is the
  tool), and no images (the studio says text plus a gradient is not a
  page). Codex wrote to `~/.codex/generated_images` and copied to the
  paths asked; both were checked.
- [2026-09-20] chose the PDF cell of the bento as a panel-to-accent-tint
  gradient over a fourth still because the bento rule wants two or three
  cells with a real image or a palette gradient, and a PDF has no honest
  object to photograph.
- [2026-09-20] chose visible client-marked placeholders (a tinted note
  "Client to supply: ...") on About and Contact over invented names and
  an address, and over hiding the sections, because the brief says the
  client fills them and a hidden section is forgotten.
- [2026-09-20] chose the privacy policy and terms as real short
  documents, dated 20 September 2026, with a visible "Marked for legal
  review" note, over a placeholder page; every sentence in them is true
  for a site that collects nothing, including the ordinary access logs a
  host keeps.
- [2026-09-20] chose the email capture on Pricing as a mailto with a
  subject and body over a form because a form would post somewhere.
- [2026-09-20] chose `https://filesanity.com` as the canonical, sitemap
  and og domain, and `hello@filesanity.com` as the mailbox, marked as
  placeholders in `src/content.ts` and on the contact page.
- [2026-09-20] chose `appType: 'mpa'` for vite preview so unknown paths
  404 instead of serving the home page, and a `404.html` that every
  static host picks up.
- [2026-09-20] chose to keep the request counter ("Requests since read")
  in the ready and cleaned states, from a PerformanceObserver, over
  dropping it, because the "verify it yourself" page points at it.
- [2026-09-20] chose to keep the sample as a fetched `/sample.jpg` on
  "Try a sample" (one request, before the read) over bundling it into the
  JS because 198 kB in the bundle is a cost every visitor pays.
- [2026-09-20] chose `og.png` as a 1200x630 capture of the home fold over
  a designed card because the fold is the product.

## Tells present, logged

- Eyebrow pills (the client's skill prescribes them; capped at one per
  three sections).
- A pill "Coming soon" badge (the client asked for the marking).
- Cold off-white ground (silver as elevation ground, the archetype).
- A two-line headline top-left over a grey sub-paragraph and one button
  (House): here it sits inside the drop tray, which is the risk, and the
  sub-paragraph is the brief's statement.
- Generated stills, no people, lit from the upper left (House "lit from
  the left" noticed): three, all one light.
- A check icon per pricing line (the "green ticks" register): oxblood,
  light weight, six lines, on the Free plan only.
- A three-column footer link map on fourteen pages.

## What in the skills conflicted, and which won

- The client's skill wants `py-24` to `py-40` sections; at the client's
  870px-tall window `py-40` shows one section per screen. `pt-24` to
  `pt-32` won.
- The client's skill wants a `blur-md` on entrances; the brief bans blur
  filters on scrolling content. Opacity and translate only won.
- The client's skill wants an eyebrow before every H1/H2; the studio caps
  eyebrows at one per three sections. The cap won.
- The client's skill says "elements never appear statically on load";
  the studio's LCP budget and CLS 0 mean the hero renders at rest. The
  hero is exempt from reveals.
- The client's skill names Lucide as banned and Phosphor Light as
  allowed; the studio's default is Phosphor. No conflict.
- The studio's "one label per CTA intent" against the client's "Download
  again" and "Clean another": the client's labels won, logged.
- inspo's `get_design_system` extraction for mollie reports radius 0 and
  a 12px body; the capture shows rounded pills and a 16px body. The
  capture won.
- The studio's tells list names "cold off-white paper" as House; the
  client's archetype is silver-grey. Logged as the archetype, not a
  reflex.

## Critic round 1 (2026-09-20): FAIL 10, all fixed

- [2026-09-20] chose to ship a source map (`build.sourcemap: true`) and
  to publish `src/lib/*.ts` as plain text at `/source/` (a `.txt` suffix,
  because static hosts serve `.ts` as video/mp2t; an index page lists
  them; Security links it) over removing the "readable source" claim,
  because the claim is the trust argument and now it is true in one
  click; the three sentences (FAQ, Pricing, Security) were reworded to
  say exactly that.
- [2026-09-20] chose one `<Mailbox />` component that renders the
  address with its "client to confirm" mark everywhere it appears
  (Pricing, Contact, Privacy, Terms) over dropping the mailbox from the
  legal pages, because a policy with no contact is worse than a marked
  one.
- [2026-09-20] chose client notes inside Privacy §7 and Terms §6, and
  folded About's and Contact's in-voice placeholders into the tinted
  note; the postal block renders only when `POSTAL` in `src/content.ts`
  is set.
- [2026-09-20] chose `inert` on every sibling of the header plus a Tab
  wrap inside the header while the menu is open over a focus-trap
  library; Chromium lets Tab leave to the browser chrome after the last
  control, so the wrap is needed with inert. Verified twelve Tabs in
  both engines.
- [2026-09-20] chose `ease-[var(--ease)]` on every Tailwind
  transition-colors and transition-transform utility over the default
  cubic-bezier(0.4, 0, 0.2, 1); `tools/verify.py` now reads the computed
  timing function of every transitioned element on every route.
- [2026-09-20] chose hairline-topped items in two columns for Security's
  "what the site does not have" over six equal bezel cards (three equal
  cards, tells.md), and the threat model stays on dl rows: the two lists
  are two families.
- [2026-09-20] reworded Formats to "What is read and what is removed."
  and About to "A small company that does one thing."; PDF keeps "A PDF
  knows what made it, and when." (House comma fragment noticed): the
  comma is the sentence's own, "what made it" and "when" are the two
  fields the page is about.
- [2026-09-20] cut every divided list to five: Pricing Free (merged the
  table line into the format line, the source line reworded), Formats
  not-yet (GIF and TIFF as one row), the threat model (formats not yet
  read and PDF streams as one entry).
- [2026-09-20] chose DOM order over `z-[-1]`: the menu overlay comes
  before the nav pill inside the fixed header so the pill paints over it
  with no z-index; the inline opacity/visibility style is gone, CSS on
  `data-open` drives both.

# v1 record, 2026-09-19 (superseded; the parser calls below still hold)

## v1 log

- [2026-09-19] chose an exploded oblique stack in HTML and CSS (skewed
  plates in a grid, dashed leaders as background gradients) over an SVG
  isometric drawing because the plates carry live text and a thumbnail,
  must reflow at 320px, and an SVG's text would not scale with the page.
- [2026-09-19] chose plate width from log10 of the segment's bytes over
  equal plates because a 694 B EXIF block and a 196 kB picture should not
  look the same size on a diagram that claims to be of the file.
- [2026-09-19] chose to keep removed plates in the figure after cleaning
  (faded, dashed, values struck through) over deleting them because the
  after-state then shows what went, and the figure does not collapse.
- [2026-09-19] chose the accent safety orange (#e0631f), the "remove before
  flight" tag on a part that must come off before the thing leaves, used
  only as a fill with ink on it (4.9:1), with a darker tint (#a83d0c, 5.6:1
  on paper; #f28a45, 7.1:1 on the dark ground) for link text, over red
  (lab-h's second ink, and a redaction register) and over blue or teal
  (metacleaner).
- [2026-09-19] chose warm vellum (#f4f2ec) and off-black (#1c1b18) over
  near-white (makingsoftware's #fbfbfb) because a dot grid on white reads
  as a web app and on vellum as drafting paper; House "cold off-white
  paper" noticed, and this one is warm.
- [2026-09-19] chose radius 0 everywhere over pill buttons because the
  anchor's radius scale is 0 and 4 and the page is a sheet of a manual;
  House "radius 0 as paper" noticed and logged: here the reason is the
  anchor, and every interactive element is the same square.
- [2026-09-19] chose light and dark by system preference with no toggle
  over light only because the audience opens the page mid-task from a
  mail client; the dark ground keeps the vellum's warmth (#1a1916). House
  "system dark mode with no toggle" noticed and logged.
- [2026-09-19] chose the headline "The file never leaves your browser."
  set in the mono at 2.25rem, two lines, over a display-size grotesk
  because the fact is the headline and the mono is the manual's voice;
  the House composition "two-line headline top-left over a grey
  sub-paragraph and one button" is present and logged: the sub-paragraph
  is the brief's 18-word statement and the button is the one CTA the
  brief fixes; the reason is the brief's copy rule, not a reflex, and the
  headline is mono, not grotesk.
- [2026-09-19] chose "Try a sample" as a text link beside the filled CTA
  over two filled buttons because the sample is a demonstration, not the
  intent; House "one filled plus one ghost" noticed: ours is filled plus
  underlined text, and the ghost style is reserved for the figure's own
  drop button.
- [2026-09-19] chose the sample's filename "IMG_4471.jpg" over
  "sample.jpg" because the figure caption reads the name, and a phone's
  own naming makes the demonstration read as a real photo.
- [2026-09-19] chose to hide the "Requests since read" readout until a
  file has been read over showing it from load because the page's own
  fonts and script are requests, and a counter reading 5 next to "nothing
  is uploaded" would be true and misleading.
- [2026-09-19] chose a request counter from PerformanceObserver over a
  hand-patched fetch because the observer sees images, fonts and beacons
  as well; blob: URLs are filtered out because object URLs never leave the
  page.
- [2026-09-19] chose to count only strippable fields in "Strip N fields"
  and in "After: 0 fields" over counting everything shown, because kept
  rows (ICC, tracked changes) are not stripped and the after figure would
  otherwise never read zero; the table still lists kept rows with their
  reason.
- [2026-09-19] chose to keep the JPEG ICC profile (APP2) and the PNG iCCP
  chunk over stripping them because a profile is how the colours are meant
  to look, not who took the picture, and stripping it shifts the colours;
  the table says "kept" and why.
- [2026-09-19] chose to write back a 32-byte EXIF block carrying only the
  orientation flag when it is not 1 over dropping it because a stripped
  phone photo that displays sideways is a broken file to the visitor; the
  report notes it.
- [2026-09-19] chose to rewrite Office packages part by part, resetting
  every zip entry's own timestamp to 1980-01-01 and dropping the thumbnail
  part with its relationship, over patching core.xml in place because the
  zip's per-part timestamps are metadata too and a patched deflate stream
  would need the same length.
- [2026-09-19] chose to show tracked-change and comment authors in DOCX
  and not remove them over accepting all changes because that edits the
  document's content; the page says "shown, not removed" and why.
- [2026-09-19] chose to blank PDF Info and XMP values in place with spaces
  of the same length over rewriting the xref table because same-length
  edits leave every offset valid; every `/Info` reference and every
  uncompressed `<?xpacket` in the file is blanked, so incremental-update
  copies go too; compressed object streams are neither read nor blanked
  and the figure's note says so ("PDF: the Info dictionary and the XMP
  packet are blanked in place. Metadata inside compressed object streams
  is not read or removed yet."), and when a file has object streams and no
  readable Info the note says to treat it as not cleaned.
- [2026-09-19] chose byte sniffing (SOI, PNG signature, %PDF, PK) over
  file extensions because a renamed file would otherwise be parsed wrong.
- [2026-09-19] chose Blob slices as the read and write unit (headers read
  by slice, the clean file a Blob of slices of the original) over reading
  the file into an ArrayBuffer because a large file then costs its
  metadata in memory, not its size; PDF is the exception (whole file read
  as bytes, never as a string, capped at 256 MB with a note), logged as a
  ponytail ceiling in `pdf.ts`.
- [2026-09-19] chose a hidden `<input type=file>` behind every "Clean a
  file" button and drop handling on the whole figure over a dropzone
  element because the brief says the CTA opens the picker and the figure
  is the object; the figure's own "Drop a file here, or choose one" is a
  real button, and the table is a real table.
- [2026-09-19] chose four sections (hero with figure, the file's table
  when present, the formats spec table, the manual paragraphs) and a
  one-line footer over feature columns, FAQ and contact because the
  structure anchor has none; families: split, table, split-text, footer.
- [2026-09-19] chose no eyebrows and "Fig. 1" as the figure's own caption
  over section eyebrows; the caption is the figure's text, not an eyebrow.
- [2026-09-19] chose no images beyond the sample photograph over
  generated stills because the page's object is the diagram and a mood
  photo beside a manual figure would be decoration; the sample is a Codex
  still (3:2, bicycle against brick, no people, no text), resized to
  1200x800 at 198 kB with EXIF, XMP, IPTC and a comment injected by
  `tools/make_samples.py`; Higgsfield was not used because the Codex CLI
  is the tool the brief names. Codex's first run wrote the file to its own
  cache and not to the path asked, so the build copies from
  `~/.codex/generated_images`; logged for assets.md.
- [2026-09-19] chose the sample's metadata values (M. Okafor, Oxford,
  iPhone 16 Pro, Lightroom) as invented and said so in the footer over
  real-looking values with no note, because a generated photo with a real
  person's name in it would be a fabricated record.
- [2026-09-19] chose no privacy policy or terms link over a placeholder
  legal page because the page collects nothing, stores nothing and sells
  nothing; the footer says so. Open assumption in CLAUDE.md.
- [2026-09-19] chose no 404 file: `vite preview` serves the index for
  unknown paths and the host is not fixed; scoped to the host.
- [2026-09-19] chose no font preload over lab-k's preload tool because
  LCP is 932 ms throttled on the phone with CLS 0.006 and the page has no
  hero image; the fold's text is the LCP element.
- [2026-09-19] chose to label the strip action "Strip N fields and
  download" over reusing "Clean a file" because they are different
  intents: "Clean a file" opens the picker everywhere (header, hero,
  figure after a clean), the strip button acts on the file already read.
- [2026-09-19] chose middle-dot-free separators (commas) in the figure
  caption and the counter over "·" because the middle dot is a logged
  tell.
- [2026-09-19] chose to keep the removed-plate transition at 500ms on
  cubic-bezier(0.16, 1, 0.3, 1), translate and opacity only, collapsing to
  none under reduced motion, over a spring library because the anchor
  earns no library and the studio cap would be spent on nothing.
- [2026-09-19] chose one tag style (orange fill, ink text, 10px mono caps)
  for REMOVE and an outlined muted one for KEPT and STAYS over colour
  coding because two accents is a tell and the outline already says
  "not this one".
- [2026-09-19] chose the spec table's "Read" column hidden below 640px and
  folded into the "Removed" cell over an inner scroll because the critic's
  exception for a comparison table is stacking or fitting, not scrolling;
  the file's field table keeps `overflow-x-auto` because long values (a
  full XMP history line) cannot stack.


## Parser scope and tests

Reads and strips: JPEG (APP1 EXIF with IFD0, Exif, GPS and IFD1
thumbnail; APP1 XMP and extended XMP; APP13 Photoshop IRB with IPTC
datasets; COM), PNG (tEXt, zTXt, iTXt including XMP, eXIf, tIME),
DOCX/XLSX/PPTX (docProps/core.xml, app.xml, custom.xml, the thumbnail
part and its relationship; DOCX tracked-change and comment authors shown,
kept). PDF: Info dictionary values and uncompressed XMP packet values
blanked in place; compressed metadata streams shown as unreadable; object
streams not entered. Not read: MP4, MOV, M4A, GIF, TIFF, PSD, DOC, XLS,
PPT, ODT, ODS, ODP, shown as unsupported by extension after byte sniffing
fails.

Test corpus, built by `tools/make_samples.py` into `tests/files`:
photo.jpg (the sample: EXIF with GPS, serial, owner, XMP with history,
IPTC, a comment), shot.png (tEXt, zTXt, iTXt, tIME, eXIf), offer.docx,
fees.xlsx, pitch.pptx (core, app with Company, Manager and TotalTime,
custom with ClientMatter and Reviewer), memo.pdf (Info and an
uncompressed XMP stream), clean.jpg (nothing to remove), notes.txt
(unsupported). `tests/run.py` drives the built page in Chromium, downloads
each clean file and asserts: no leaked strings, Pillow opens the images
with no EXIF, XMP or comment and only APP0 left; zipfile CRCs pass, the
three docProps parts are empty, no thumbnail, entry timestamps reset,
python-docx, openpyxl and python-pptx open the documents with content
intact; pypdf opens the PDF with page text intact, Info values blank,
XMP creator and tool blank, same byte length. Also: "Nothing to remove"
for clean.jpg, "cannot read .txt" for notes.txt, no page errors, and
zero non-blob network requests across six reads and cleans. Result:
ALL PASS.

## Network-log proof

`tools/shots.py` records every request in Firefox from before the sample
is read to after the clean and the download: `shots/network-log.json`,
`requests_during_read_and_clean: []`. `tests/run.py` asserts the same in
Chromium across six files. The page has no fetch except `/sample.jpg` on
"Try a sample", which is a same-origin GET of the bundled sample before
anything is read.

## Measured

- LCP 932 ms, CLS 0.006 at 390x844, 2x, 1.6 Mbps, 150 ms RTT, 4x CPU
  (Chromium CDP). Desktop LCP 76 ms, CLS 0.0002.
- JS 80.0 kB gzipped (React 19 is 60 of it; the parsers and page are the
  rest), CSS 4.8 kB gzipped, fonts 7 Latin woff2 files of 20 to 25 kB
  each, loaded by unicode-range.
- No horizontal scroll at 320, 390, 768, 1024, 1440 with a file read.
- Six tab stops in order, each with the 2px orange outline.
- Reduced motion: plate transition 0s.
- U+2013 and U+2014 in shipped copy: 0.

## tells.md defaults present, with reasons

- Mono-caps labels beside values (the figure's callouts and the tables):
  the surface anchor's mechanism and the studio's anchor 1 ("spec tables
  in 11px mono"); the values are the visitor's own file, not decoration.
- Radius 0, warm paper, off-black ink, one accent, system dark mode
  without a toggle, a two-line headline top-left with a sub-paragraph and
  one button, one-row footer: each logged above with its reason from the
  brief or the anchor. Three House items on one page are here and
  logged; the NEW line names what is not House: a mono display face, a
  boxed figure with leaders as the hero, no photograph.
- Left text, right object: the brief fixes the object; the copy could
  not sit over it without hiding the diagram at 1366x650.
- No eyebrows, no middle dots, no version stamps, no fake UI: the figure
  is a working component.

## What in inspo or the skill was wrong or missing

- `get_design_system` returned a wrong type ramp for makingsoftware (h1 at
  16px) and a ground colour that contradicts the site's own CSS variable;
  the captures had to be read instead. The tool's own note says to verify.
- `get_reference_jsx` needs `type` as well as `id`; the tool list
  documents only `id`.
- Search results carry thumbnails after the JSON, as warned; the wrapper
  needs `raw_decode`. Semantic queries about "never uploads" or "runs on
  your machine" return nothing relevant: the archive has no file-tool
  register, and the privacy or developer registers are all dark indigo.
- assets.md: Codex exec replied with the requested path but wrote only to
  `~/.codex/generated_images/<session>/`; the build has to copy from the
  cache. Worth a line under the ladder's rung 1.
- The skill's "hero image under 200 kB" budget has no line for a page
  whose hero is a working component with no image; the LCP element here
  is a paragraph, which is what the critic will measure.

## Critic round 1 (FAIL 6) and fixes, 2026-09-19

1. Cleaned-state contrast: `.row-gone .callout` opacity 0.55 dropped text
   to 2.4:1. Chose colour `var(--muted)` on the callout with no opacity
   over keeping a lighter fade because muted measures 6.0:1 on paper and
   6.7:1 on the dark ground; the plate itself still fades and goes dashed,
   the values still strike through. Measured on painted glyphs in the
   after-state (`tools/measure.py`): worst 4.9:1 light (the REMOVED tag's
   ink on orange), 5.0:1 dark.
2. Leader join: the leader was a fixed stub in its own grid column. Chose
   a flex cell holding the plate at its byte-derived width and the leader
   as `flex-1` over absolute positioning, so it starts at the plate's
   drawn edge and ends at the callout at every width. Measured at
   1917x870, 1366x650 and 390x844, empty and with a file: plate edge to
   leader 4 px on every row, leader end to label 12 px (8 px on phone).
3. PDF copy against the parser: compressed XMP streams are shown as
   "compressed stream, kept"; the figure note and the spec row say a
   compressed XMP stream (the usual Word or Acrobat case) is shown and
   kept; the After line reads "N removed, M kept"; when nothing is
   strippable but something is kept the foot says so instead of "Nothing
   to remove". `tests/files/memo-z.pdf` (FlateDecode /Metadata) added;
   `tests/run.py` asserts the creator survives, the note text and the
   "8 removed, 1 kept" line.
4. Refusals by reason: byte sniffing failing on a known extension says
   "This .jpg does not begin like a JPEG"; an unknown kind says "cannot
   read .txt files yet"; a dropped folder (webkitGetAsEntry isDirectory, or
   an unreadable or empty File) says it is a folder; more than one file
   reads the first and the caption says "One file at a time, reading
   <name>". The picker itself is single-file, so two files arrive only by
   drop; the test dispatches a synthetic drop. `tests/files/notajpeg.jpg`
   added.
5. Live region: `aria-live="polite"` on the figcaption, which carries the
   state line, the hint and the request counter.
6. Hygiene: dist rebuilt (og.png served as image/png), the scaffold's
   icons.svg sprite gone from public and dist. Inline `style` on the body
   plate replaced by `.plate-body`; the remaining inline styles are the
   data-derived plate widths and row indents.

Notes: the figure's "Drop a file here, or choose one" stays as the
figure's own control, logged above. At 390x844 the drop bar sits at 886
after tightening the hero spacing (was 947); the Success line's three
items (what it does, that the file stays, the CTA) are above the fold and
the bar is the figure's second way in, so it is left below.

Not regressed: JS 80.4 kB gz, LCP 936 ms and CLS 0.006 throttled phone,
six tab stops, zero requests during read and clean, ALL PASS on nine
files and four edge paths.

## Critic round 2 (FAIL 1), 2026-09-19

Strip was silent and stranded focus. Chose a `useEffect` on the status
change that focuses "Download again" after the commit over relabelling
one button element, because the two buttons have different intents and a
rAF after setState raced React's commit (focus fell to body on some
runs). The foot is `aria-live="polite"`, so the Before/After line is
announced. Verified in Firefox and Chromium across three files:
activeElement after a keyboard strip is "Download again"; the result
text sits in a polite live region. `tests/run.py` asserts both on every
case.

## PWA (2026-09-20)

Installable and offline after one visit. No library: a hand-written
worker generated at build, because workbox or vite-plugin-pwa would add
a dependency for forty lines and the studio's house style is hand-written.

- `scripts/pwa.mjs` walks `dist/` after prerender and writes `dist/sw.js`
  with the precache list; rejected a static `public/sw.js` with a
  placeholder, because the hashed asset names exist only after the build
  and a walk also picks up new routes (the blog's) without being told.
- Cache version is a hash of every precached URL plus its bytes, not of
  the list alone; rejected hashing the list, because a copy edit changes
  a page's bytes but not its name and would never bust the cache.
- Wired as `&& node scripts/pwa.mjs` in package.json's build script;
  rejected an import at the end of `scripts/prerender.mjs`, because that
  file is under concurrent edit by the blog build.
- Precache excludes source maps, `og.png`, `/source/*`, `sitemap.xml`,
  `robots.txt` and the `<route>.html` twins; rejected precaching all of
  `dist/`, because the map alone is 1.2 MB and the crawler files and the
  social image are never requested by a visitor.
- Route keys are the browser's own URLs (`/faq`, `/404`), never the
  `.html` form; rejected `/404.html` after Chrome refused the cached
  response for a navigation because Wrangler's `auto-trailing-slash`
  had redirected it and the cache kept the `redirected` flag.
- Precache requests use `cache: 'no-cache'` so a new worker revalidates
  HTML against the server instead of the HTTP cache; rejected the default
  mode, which could re-precache a stale page from the browser cache.
- Navigations are stale-while-revalidate with the cached `/404` as the
  last resort; precached files are cache-first; every other request
  (non-GET, cross-origin, uncached paths) is not intercepted. Rejected
  network-first for HTML, because a reload mid-page offline would wait
  for the timeout before falling back.
- `skipWaiting` on install and `clients.claim` on activate, so a new
  build takes over on the next load with no toast; rejected the default
  waiting worker, because a reload does not release the old client and
  the update would sit until every tab closed.
- Registration after `load`, `import.meta.env.PROD` only; rejected
  registering at module evaluation, which would compete with the LCP
  image and the hydration for bandwidth.
- Icons rendered from `favicon.svg` with cairosvg; the maskable one
  paints the glyph at 80% on the favicon's own orange so any mask keeps
  it whole. Rejected a separate mark for the maskable icon: one glyph,
  one accent.
- `tests/run.py` unchanged. Measured: in Chromium the worker's precache
  fetches never reach `page.on('request')` (they belong to the worker,
  not the page); in Firefox the two icon fetches land at the load event,
  inside the test's 500 ms settle. `ALL PASS` with the worker live in
  both engines. `tools/pwa_check.py` covers the offline path against
  `wrangler dev`.

## Blog (2026-09-20)

The brief's "No blog" is overridden by the studio owner. Five posts at
launch, /blog and /blog/<slug>, an RSS feed, Blog in the footer's Product
column. The nav stays at six.

- Chose a TS/TSX module per post in `src/posts/` (a `meta` export and a
  body component) over Markdown with a parser: no dependency, the em/en
  dash guard and the `.prose` styles apply unchanged, and `tsc` checks
  every post.
- Chose a build-time list in `src/posts/index.ts` sorted newest first over
  `import.meta.glob`: five files, one import each, and the SSR entry can
  export the same list for the feed.
- Chose the posts inside the one JS bundle (113 kB gz per route, was 104)
  over a lazy chunk per post: the site's one-bundle decision stands and
  the budget is 150; revisit at twenty posts.
- Chose rows on hairlines for the index (date and reading time left,
  title and description right, the changelog's grid) over cards or a
  two-column tile grid: are.na, and the site's rows everywhere else.
- Chose a middle dot between date, reading time and author on the meta
  line over commas or a stacked list: one line, no dash, reads as a
  byline. The dots are `aria-hidden`.
- Chose "FileSanity" as the author over an invented name: About and
  Contact carry the client's placeholders for real names.
- Chose the post body in `.prose` with the page's container over a
  `Section`: `Section` fixes `pt-24`, which is too much under a byline;
  the body sits `pt-12` below it.
- Chose to append three `.prose` rules (list markers back on `ul`, a
  size step down on `code`, a margin between a heading and its first
  paragraph) over per-post classes: Privacy, Terms and Changelog get the
  same fix.
- Chose JSON-LD `BlogPosting` and the feed `<link>` written by
  `scripts/prerender.mjs` into the head over rendering them in React:
  nothing reaches the client bundle and the dash guard still runs on the
  finished HTML.
- Chose RSS 2.0 at `/blog/feed.xml` with an Atom self link over Atom or
  JSON Feed: the one every reader accepts.
- Chose a Closer on the index and a Pill plus "All posts" at the end of a
  post over a related-posts block: one CTA label everywhere, and five
  posts are the whole archive one click away.
- Dates run 16 to 20 September 2026, one per day, so newest-first is a
  real order at launch; `updated` is optional and shown when set.
- Tells: the middle-dot byline is a default of blog templates, logged.
  Post h1s are the page's `PageHead` at 3.25rem; a long title wraps to
  three lines at 390, which is accepted over a smaller post-only size.
