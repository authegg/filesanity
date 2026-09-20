# FileSanity Cloud (api.filesanity.com)

The hosted API: the self-hosted handler behind keys and a monthly quota, sold through Lemon Squeezy.
One Worker, one KV namespace, no database, no email sending. The customer's key is the licence key on
their Lemon Squeezy receipt; trial keys are issued by the Worker's own page.

## Set up once (about ten minutes)

1. Lemon Squeezy: create the store (say, `filesanity`). Settings > General: note the **Store ID**.
2. Products: create "FileSanity Cloud" with two subscription variants, **Starter** ($19/month) and
   **Business** ($79/month). On the product, turn on **Generate license keys** (activation limit: unlimited
   or 5). Note each variant's **ID** and its **Buy link** (Share > Checkout link).
3. Settings > Webhooks: add `https://api.filesanity.com/webhooks/lemonsqueezy`, tick the `license_key_*`
   and `subscription_*` events, set a **signing secret**.
4. Cloudflare: `npx wrangler kv namespace create KEYS` from this folder, paste the id into `wrangler.jsonc`.
5. Secrets, from this folder:
   ```
   npx wrangler secret put LS_STORE_ID
   npx wrangler secret put LS_WEBHOOK_SECRET
   npx wrangler secret put LS_VARIANT_STARTER
   npx wrangler secret put LS_VARIANT_BUSINESS
   node keygen.mjs | npx wrangler secret put REPORT_PRIVATE_KEY_JWK   # signs clean-reports; keep the printed public key
   ```
6. `src/cloud.ts`: paste the two Buy links. Rebuild and deploy the site so /cloud links to them.
7. `npx wrangler deploy` from this folder. Check `https://api.filesanity.com/` and `/.well-known/filesanity-report-key`.

Lemon Squeezy is the merchant of record: it charges, handles VAT and sales tax, issues the receipt with the
licence key, and pays out. When a subscription lapses, Lemon Squeezy marks the licence key expired or
disabled and the Worker's next check refuses it (the cache is one hour; a licence webhook clears it sooner).

## Local check

`python3 tools/cloud_check.py` runs the Worker under `wrangler dev` against a mock Lemon Squeezy and checks the
trial flow, quotas, a licence key, the webhook signature and a signed report.

## What is stored

Per trial key: the email, the creation time and the count. Per licence key: the plan, the customer email
from Lemon Squeezy, and the monthly count. Nothing about any file.
