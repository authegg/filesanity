# Harvest

Fixes the owner asks for after "done". Each becomes a rule for the studio layer.

## v3, after critic PASS (round 2, 2026-10-08)

Owner, in their own browser (6):
1. "The hero is tilted, which makes it not serious." The -2.5deg idle tilt was the J direction's motion; on a security product it read as a toy. Rule: a rotated tool or card on a trust product needs a tone reason from the brief, logged; "it moves" is not one.
2. "In zoom the horizontal lines look weird." Section rules ran the full window while the content sat in a 1240px column, so zoomed out they overhung empty space. Rule: rules between sections span the content column, not the window; the critic checks a zoomed-out (2560px) screenshot.
3. "Mobile menu feels basic." A solid sheet of small links passed every mechanical check. Rule: the phone menu is a designed surface: full height, links at display size, current page marked, scroll locked, Escape closes, burger to X.
4. "Replace the arrow with just chevrons." Rule: list-row affordances in navigation are chevrons; arrows read as marketing CTAs.
5. "The bike is off." The photo floated mid-column and the field values were lime. Rule: an image beside text is top-aligned and fills its column; the accent stays on actions, never on data values.
6. "Remove the placeholder and add real data." Visible placeholder marks read as unfinished. Rule: fill from true project facts (licence, location, open source, payment processor) and keep only genuine unknowns in PLACEHOLDERS.md, unmarked on the page once the owner says so.

Found by me after the extension was declared done (1):
7. The Firefox build never cleaned a file. Firefox shows a content script the page's File behind a realm wrapper, the parsers' awaits were refused ("Permission denied to access property constructor") and every file passed through untouched; the check ran in Chromium only. Fixed by cleaning in the background page on Firefox and handing results back in the page's realm. Rule: a browser extension is runtime-checked in every engine it ships to, by asserting the page receives the cleaned bytes, not that the code ran.

Count after PASS: 6 from the owner, 1 self-found. The critic lacked: a zoomed-out view, a judgement of the phone menu as a surface, and a second engine for the extension.
