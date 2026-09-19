# Decisions

One line per autonomous call: what was chosen, what was rejected, why.
The rejected alternative is the part that matters.

Format: `- [date] chose X over Y because Z`

## Client environment

Firefox at 1917x870 primary; phone 390x844; also 1366x650. Verified in
Firefox (fold and full at 1917x870 and 390x844, the flow strip) and
Chromium (1366x650, 390x844, 1917x870, the vitals run, dark mode,
reduced motion, five widths).

## Ledger read (SHIPPED.md, last three rows, 2026-09-19)

- lab-g-blath: geometric sans, warm paper with no accent (polychrome
  bands as data), space and photographs, 7/5 split, colour-block closer,
  backlit saturated stills, pick-a-Saturday interaction, light and dark.
- lab-h-press: serif display, cotton card and ink with one red, italic
  shoulder notes and a docket, 7/5 sprite stage, proof docket closer,
  keyed sprite sheets, a terminating print run, light and dark.
- lab-i-dental: signage sans, cool green ground with coral, drawing-sheet
  fields with notched labels, 380vh pinned stage, chart-entry closer,
  keyed molar traced into linework, one scroll value driving six paused
  animations, light and dark.

Shared by all three: light and dark by token flip; a hero that is a
working object with the copy beside it; generated photographs. This page
also ships light and dark (reason from the brief: the audience opens
this from a mail client mid-task, at whatever scheme their desk is in,
and a tool page that flashes white on a dark desk reads as a popup) and
a working object beside copy (the brief fixes it: "the hero IS the
product"). It ships no generated photograph except the sample file
itself, which is the product's input, not a mood image.

## Reference pass

Step 1. `get_filters` run 2026-09-19: 11 styles, 24 industries, 19
macrostructures (coverage: specimen 110, split-studio 148, feature-stack
124, marquee-hero 156, long-document 19, manifesto 11, type-specimen 21,
component-playground 13, letter 5, stat-led 4). Searches, all with hero
captures downloaded and looked at, not read from northstar text:

1. "drop a file in the browser, it never uploads, works offline", 10:
   tympanus-net, dropdeadgenerous-org, rapha-cc, generalintelligencecompany,
   cyrillic-digital, forestadmin-com, tavus-io, humaan-com, mixpotion-co,
   branchfurniture-ca. Semantic search does not understand "never
   uploads"; junk.
2. "tool that inspects a file and shows its hidden data", industry
   developer-tools, 10: flatfile-io, mage-ai, sourcegraph-com, novu-co,
   lottiefiles-com, posthog-com--about, qdrant-tech, statsig-com,
   forestadmin-com, lithic-com. All dark SaaS heroes.
3. "privacy tool metadata exif remover", style monochrome, 10: algolia,
   astro-build, azure, bolt-new, builder-io, buildkite, bun-com, chakra-ui,
   circleci, codepen. Every one "deep indigo expanse": the archive's
   privacy/dev register is the anti-anchor.
4. "utility that does one thing, the object is the headline", swiss,
   paperBand light, 10: feathericons-com, synthesia-io,
   thedesignersfoundry-com, forestadmin-com, clay-com, daisyui-com,
   displaay-net--about, heatherwick-com--projects,
   thecreativeindependent-com, thefutur-com.
5. "file inspector hex dump table of fields", displayClass mono, 10:
   arweave-org, bugatti-com, thecreativeindependent-com, finethought-com-au,
   kvs-services, posterco-tv, motherduck-com, localcan-com,
   brethrendesignco-com, jordan-delcros-com.
6. "manifesto about privacy, plain speaking", macrostructure manifesto, 10:
   deadwater-fr--vision, nglm-com--about, overmindlab-ai--about,
   tokens-studio--about, nopan-com--about-us, goodside-studio--about,
   cornellbotanicgardens-org, platonphoto-com, whitecube-com, everswap-com.
7. "local first, offline, runs on your machine", brutalism, 10: qonto-com,
   designmaestro-io, feathericons-com, tonal-com, bennettandclive-com,
   portalone-studio, convex-dev, fontwerk-com, lusion-co, orpetron-com.
8. "type specimen table of glyphs and values", industry type-foundry, 8:
   commercialtype-com, pampatype-com, lift-type-fr--products-ace,
   typearture-com, boldmonday-com, fontshare-com, lettersfromsweden-se,
   newglyph-com.
9. "developer tool with a live demo in the hero, product working",
   developer-tools, 10: forestadmin-com, tavus-io, novu-co, fal-ai--pricing,
   liveblocks-io--about, raycast-com--pricing, smashingmagazine-com,
   unkey-com, polar-sh, mintlify-com.

Macrostructure pulls (`find_examples_for_macrostructure`): specimen 14,
type-specimen 12, long-document 12, manifesto 11, split-studio 10.

Hero captures downloaded and looked at (26, on five contact sheets):
arweave-org, bennettandclive-com, brilliant-org, commercialtype-com,
craft-wild-as--bcp, deadwater-fr--vision, displaay-net, excalidraw-com,
feathericons-com, fontwerk-com, gwern-net, kvs-services, localcan-com,
makingsoftware-com, motherduck-com, newglyph-com, nglm-com--about,
orpetron-com, overmindlab-ai--about, posterco-tv, realfood-gov,
sourcetreeapp-com, thecreativeindependent-com, tympanus-net, unkey-com,
velvetyne-fr. Full pages looked at (2): makingsoftware-com, excalidraw-com.

What the captures showed that the text did not: nothing in the archive
is a file tool, and the developer-tools register is one dark indigo
page with a glowing accent, which is metacleaner in a hoodie. The
mechanisms worth taking sat outside it: makingsoftware (the page is a
reference manual whose hero is an exploded, labelled isometric diagram of
a floppy disk, every part on a leader line in mono caps, figure boxes
with rotated FIG numbers), excalidraw (the landing page is the empty
tool; the storage claim, "your drawings are saved in your browser's
storage", is a three-line note under the wordmark, not a headline),
arweave (mono headline, the page is a map with four numbered tabs),
brilliant (working widgets between the headline's words), feathericons
(the tool's grid and its customise panel are the page under a one-line
headline), craft-wild (a pixel field along the foot), localcan (a dark
card whose right half is a 3x2 grid of drawn parts).

Step 2. Anchors.

- Structure and pace: **excalidraw-com**, https://excalidraw.com,
  developer-tools (an open-source tool, not a SaaS marketing page).
  Mechanism: the page is the product's empty state; the first screen is
  the tool with nothing in it, the instructions and the "saved in your
  browser" claim are small notes placed where they apply, and there is
  nothing to scroll to. Taking: the tool as the first and main screen;
  the trust fact as a note on the object, not a banner; no feature
  section, no pricing, no testimonials; motion limited to what the tool
  does when you act. Leaving: the hand-drawn face, the toolbar, the
  purple, the centred wordmark, the four text links.
- Surface: **makingsoftware-com**, https://makingsoftware.com, education
  and media (a book). Mechanism: an exploded-parts diagram, each part
  lifted off the one below, joined by a dashed leader to a mono-caps
  label; figures boxed on a dot grid with a caption; a reference manual's
  register, no marketing sentence anywhere. Taking: the exploded stack as
  the way the file is shown; dashed leaders and mono-caps callouts;
  boxed figure with a dot-grid ground and a "Fig. 1" caption; a spec
  table for the formats; body copy as a manual's paragraphs. Leaving:
  Departure Mono (bitmap face) and the Arizona serif body; the isometric
  drawing (ours is oblique, drawn by CSS from the file's own bytes); the
  electric blue (blue on white is metacleaner); the rotated FIG labels
  (a tell in tells.md, and ours would have nothing to say).
- Neither is SaaS. Anti-anchors held: no centred dropzone icon, no
  three feature columns, no tool cards, no blue, no padlock, no shield,
  no green ticks.
- `compare` on the pair: both light, both minimalism and swiss, distinct
  macrostructures (Long Document, Component Playground). makingsoftware
  spacing 40/128/256, radius 0 and 4, container 1536; excalidraw base 4,
  radius 0/6/8, container 1440.
- `get_design_system` makingsoftware-com: the extraction is thin and
  partly wrong (h1 reported as arizona 16px; the autopsy names a pale
  sage ground while the site's own `--background` is #fbfbfb and the
  capture is white). Taken: 4px base; spacing 40/128 rounded to our
  32/48/64/80 rhythm (256 dropped, the page is short); radius 0
  everywhere (interactive included); container capped at 1400 rather
  than 1536 so the figure's callouts stay under 60ch at 1917. Changed:
  ground to a warm vellum (#f4f2ec) instead of near-white, so the dot
  grid and the plates read as drafting paper rather than a web page;
  cobalt to safety orange (below); the bitmap display face to IBM Plex
  Mono.
- Fonts: makingsoftware's Departure Mono is a bitmap face and would read
  as retro; Arizona is commercial. IBM Plex Mono 400/500/600 for the
  headline, figure, tables and buttons, IBM Plex Sans 400/500/600 for
  body: one superfamily, the manual's face (Plex was drawn for IBM's
  manuals), OFL, on Fontsource, Latin subset only. Rejected: Space
  Grotesk plus Space Mono (the grotesk is the House display reflex);
  Geist Mono (saltline); JetBrains Mono (lab-b); Inter (logged reflex).

Step 3. Reference components (`find_reference_components`, then
`get_reference_jsx` with type and id): hero/documentary (headline as a
caption, a credit block in the margin: the figure caption and the
"Requests since read" readout take its place), stat/before-after (two
figures with movement between them: the "Before: 198.5 kB, 52 fields.
After: 196.0 kB, 0 fields." line), features/workbench (copy left, working
demo right, "real strings, no faux chrome": the hero split),
footer/colophon (mono, one block, no link map). Used for structure only;
the component library's `text-meta` became `.meta`.

## Read

Read A, the first association, kept.

```
Reading this as: a launch page for a file tool, for people about to send a
file to a stranger, built as one page of a hardware manual: the file taken
apart as an exploded diagram beside a typewritten fact, serving
excalidraw-com for structure and pace and makingsoftware-com for surface
(studio anchor 1, the hardware manual).
MOTION 4: what excalidraw ships: nothing moves until you act; then the
tool responds. The plates lift off when you strip; no reveals, no load
animation, no scroll work.
RISK: the hero is a hardware manual's exploded-parts diagram of the
visitor's own file, drawn from its bytes: every metadata segment a plate
lifted off the picture, sized by its byte count, joined by a dashed leader
to the real values found, with a safety-orange REMOVE tag on each; the
file's body is the bottom plate, and cleaning knocks the tagged plates off
and strikes their values through while the body stays. Before any input the
same diagram shows a typical file's anatomy, so the concept is on the page
with nothing dropped. No dropzone icon, no padlock, no feature columns.
COST: if the diagram reads as decoration, a journalist who wanted a big
"upload" box does not find where to drop the file and leaves; if it reads
as a developer's hex viewer, HR and sellers think it is not for them.
Rejected larger risk: brilliant.org's mechanism, the drop target and the
request counter set inside the headline's own words; rejected because the
headline has to state the fixed idea legibly in a 300px thumbnail and a
sentence full of controls is not readable at that size.
SEEN: a short page on warm vellum: top-left a two-line typewriter
headline, one orange button and a red-brown link; right, a large boxed
figure on a dot grid holding a staircase of four tilted plates joined by
dashed leaders to labelled notes, three with a small orange tag; under it
one mono spec table and a short column of manual text; a one-line footer.
NEW: a monospaced display face (lab-g geometric sans, lab-h serif, lab-i
signage sans); a hero shape that is a boxed figure with callouts beside a
copy stack (lab-g and lab-h 7/5 splits with photographs and a sprite
stage, lab-i a pinned stage); no photograph on the page beyond the sample
file the visitor loads (all three ship generated stills); a warm vellum
ground (lab-g warm paper is close; lab-h cotton card is close; lab-i cool
green is not: so the ground is not the NEW line, the face and the figure
are).
GREP: exploded, diagram, callout, leader, plate, figure, schematic, manual,
dot grid, parts.
MOTION: the diagram is drawn from the visitor's file: plate widths follow
each segment's byte count, the callouts carry the values found, and on
"Strip and download" the tagged plates slide off and their values strike
through, with the before and after sizes and field counts under the figure.
```

Read B, the counter-read, rejected in one line: a manifesto page serving
anchor 3 (are.na) and deadwater-fr--vision, one black screen with the
sentence "The file never leaves your browser." set huge and the tool
pushed to a second screen; rejected because the brief fixes the hero as
the product working, and a black manifesto ground beside an orange tag
is the "privacy tool" register the brief names as an anti-anchor.

## Log

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
