# FileSanity API, self-hosted

The same parsers as filesanity.com, behind two POST routes, on a server you run. Nothing is sent to FileSanity.

## Run it

Cloudflare Worker (free tier is enough):

    npx wrangler deploy            # from this folder; worker.mjs and wrangler.jsonc are all it needs
    npx wrangler secret put API_TOKEN

Node 20 or newer, no dependencies:

    API_TOKEN=change-me node node.mjs 8787

## Call it

    curl -H "Authorization: Bearer change-me" --data-binary @photo.jpg -H "X-Filename: photo.jpg" \
         https://your-host/inspect                      # the report, JSON

    curl -H "Authorization: Bearer change-me" -F file=@offer.docx \
         "https://your-host/clean?keep=core" -o offer-clean.docx   # the clean file; ?keep applies a policy

Reply headers on /clean: `X-FileSanity-Removed` and `X-FileSanity-Kept` (field counts), `X-FileSanity-Note` when the
page would show a note (for example a PDF with compressed metadata streams, which are kept).

Policy kinds for `?keep=`: exif, xmp, iptc, com, text, exif-png, time, core, app, custom, thumbnail, info.

Errors: 401 no or wrong token, 415 a format FileSanity does not read, 422 a file it could not rewrite. Without
API_TOKEN set the API is open; do not expose it that way beyond a private network. Cloudflare Workers accept request
bodies up to 100 MB on the free plan.
