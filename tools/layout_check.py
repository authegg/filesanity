"""Sibling rows that should look alike but do not (and sheets whose foot space differs): under one parent, wrapping flex rows of the same class where some wrap
onto a second line and some stay on one (the account's plan rows once put Team's button beside its text and the others
under it). Runs every route signed out, and /account in each account state, at the phone matrix and the owner's
desktops, in Firefox and Chromium, against `npx wrangler dev --port 8787` (DEV_LINKS=1).
Run: python3 tools/layout_check.py [base]
"""
import hashlib, hmac, json, sys, time, urllib.request
from playwright.sync_api import sync_playwright

BASE = next((a for a in sys.argv[1:] if not a.startswith('--')), 'http://127.0.0.1:8787')
# The route list and screen sizes are site_check.py's, read from its source so the two never drift.
exec(''.join(l for l in open('tools/site_check.py') if l.startswith(('ROUTES =', 'SIZES ='))))
VARS = dict(l.split('=', 1) for l in open('.dev.vars').read().strip().split('\n'))

def post(path, body, headers={}):
    r = urllib.request.Request(BASE + path, json.dumps(body).encode(), {'Content-Type': 'application/json', 'Origin': BASE, **headers})
    return json.load(urllib.request.urlopen(r))

class Keep(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a): return None

def session(email):
    """Signs in once and returns the session cookie; sign-in links are rate limited, so pages reuse it."""
    link = post('/api/auth/start', {'email': email, 'turnstile': 'XXXX.DUMMY.TOKEN.XXXX'})['link'].split('/', 3)[3]  # wrangler dev reports the route's host
    try: urllib.request.build_opener(Keep).open(BASE + '/' + link)
    except urllib.error.HTTPError as e: return e.headers['Set-Cookie'].split(';')[0].split('=', 1)
    raise AssertionError('sign-in did not redirect')

def api(cookie, path, body):
    return post(path, body, {'Cookie': '='.join(cookie)})

def hook(email, price, status='active', extra={}):
    raw = json.dumps({'event_type': 'subscription.updated', 'data': {'status': status, 'customer_id': 'ctm_test', 'next_billed_at': '2026-11-08T00:00:00Z', 'scheduled_change': None, 'custom_data': {'email': email}, 'items': [{'price': {'id': price}}], **extra}})
    ts = str(int(time.time()))
    sig = hmac.new(VARS['PADDLE_WEBHOOK_SECRET'].encode(), f'{ts}:{raw}'.encode(), hashlib.sha256).hexdigest()
    urllib.request.urlopen(urllib.request.Request(BASE + '/api/webhooks/paddle', raw.encode(), {'Paddle-Signature': f'ts={ts};h1={sig}'}))

# A wrapping flex row "wraps" when a later child starts at or below the first child's bottom.
MIXED = """() => {
  const out = []
  const wraps = (el) => {
    const ch = [...el.children].filter((c) => c.getClientRects().length && getComputedStyle(c).position !== 'absolute')
    if (ch.length < 2) return null
    const first = ch[0].getBoundingClientRect()
    return ch.slice(1).some((c) => c.getBoundingClientRect().top >= first.bottom - 1) ? 'wrapped' : 'one line'
  }
  for (const parent of document.querySelectorAll('body, body *')) {
    const groups = {}
    for (const c of parent.children) {
      const s = getComputedStyle(c)
      if (!(s.display === 'flex' && s.flexWrap === 'wrap' && s.flexDirection === 'row')) continue
      const k = c.tagName.toLowerCase() + (c.classList[0] ? '.' + c.classList[0] : '')
      ;(groups[k] ??= []).push(c)
    }
    for (const [k, g] of Object.entries(groups)) {
      const st = g.map(wraps).filter(Boolean)
      if (new Set(st).size > 1) out.push(`${k}: ${st.join(', ')}`)
    }
  }
  // Sheets on one page end the same distance below their last line (an empty error line once padded some).
  const feet = [...document.querySelectorAll('.sheet')].map((sh) => {
    const last = [...sh.children].filter((c) => c.getClientRects().length && c.textContent.trim()).at(-1)
    return last ? Math.round(sh.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom) : null
  }).filter((n) => n !== null)
  if (new Set(feet).size > 1) out.push(`sheet foot space differs: ${feet.join(', ')}`)
  return out
}"""

fails = []
# Account states: free, own Team with keys and a member, cancelled Pro, a Team member, and a free account sent to buy Pro.
run = str(int(time.time()))
owner, member, ended, free = (f'lay-{k}-{run}@example.com' for k in ('team', 'member', 'ended', 'free'))
hook(owner, VARS['PADDLE_PRICE_TEAM'])
hook(ended, VARS['PADDLE_PRICE_PRO'], extra={'next_billed_at': None, 'scheduled_change': {'action': 'cancel', 'effective_at': '2026-11-08T00:00:00Z'}})
cookies = {e: session(e) for e in (owner, member, ended, free)}
for name in ('Laptop', 'Build server that cleans uploads'): api(cookies[owner], '/api/keys', {'name': name})
api(cookies[owner], '/api/team', {'email': member})
host = BASE.split('//')[1].split(':')[0]
pages = [(None, r) for r in ROUTES if r != '/account'] + [(free, '/account'), (free, '/account?plan=pro'), (owner, '/account'), (ended, '/account'), (member, '/account')]

with sync_playwright() as p:
    for eng in ('firefox', 'chromium'):
        br = getattr(p, eng).launch()
        print(eng)
        for w, h in SIZES:
            for who, r in pages:
                ctx = br.new_context(viewport={'width': w, 'height': h}, service_workers='block')
                if who: ctx.add_cookies([{'name': cookies[who][0], 'value': cookies[who][1], 'domain': host, 'path': '/'}])
                pg = ctx.new_page()
                pg.goto(BASE + r, wait_until='load', timeout=60000)
                if who: pg.wait_for_selector('.acct:not(.skel)', timeout=15000)
                pg.evaluate('document.fonts.ready')
                for m in pg.evaluate(MIXED):
                    msg = f'{eng} {w}x{h} {r}{" as " + who.split("-")[1] if who else ""}: {m}'
                    print('  FAIL ' + msg); fails.append(msg)
                ctx.close()
        br.close()
print(f'{len(fails)} mixed row groups' if fails else 'no mixed row groups')
sys.exit(1 if fails else 0)
