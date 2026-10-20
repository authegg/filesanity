// Tells Bing and the other IndexNow engines every page in the sitemap changed; run after a deploy.
import { readFileSync, readdirSync } from 'node:fs'
const key = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f)).slice(0, -4)
const urlList = [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'filesanity.com', key, keyLocation: `https://filesanity.com/${key}.txt`, urlList }),
})
console.log(res.status, `${urlList.length} URLs`) // 200 or 202 is accepted
if (!res.ok) process.exit(1)
