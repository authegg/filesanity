"""Creates (or finds) the Turnstile widget for sign-in on the owner's Cloudflare account, with wrangler's login.
The site key is public and goes to .env.production (VITE_TURNSTILE_SITEKEY, read at build). The secret goes to
.prod.vars (gitignored, mode 600) for `npx wrangler secret bulk .prod.vars` at deploy; it is never printed.
Run: python3 tools/cf_turnstile.py
"""
import json, os, re, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACCOUNT = '40e0cae9b5706dafcfbc65202ad05b51'
NAME, DOMAINS = 'filesanity-signin', ['filesanity.com', 'www.filesanity.com']
TOKEN = re.search(r'oauth_token\s*=\s*"([^"]+)"', open(os.path.expanduser('~/.config/.wrangler/config/default.toml')).read())[1]

def api(method, path, body=None):
    req = urllib.request.Request(f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/challenges/widgets{path}', method=method,
                                 data=json.dumps(body).encode() if body else None, headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    d = json.load(urllib.request.urlopen(req))
    assert d['success'], d['errors']
    return d['result']

found = next((w for w in api('GET', '?per_page=50') if w['name'] == NAME), None)
w = api('GET', f'/{found["sitekey"]}') if found else api('POST', '', {'name': NAME, 'domains': DOMAINS, 'mode': 'managed'})

def put(path, key, value, private=False):
    p = os.path.join(ROOT, path)
    lines = [l for l in (open(p).read().splitlines() if os.path.exists(p) else []) if not l.startswith(key + '=')]
    with open(os.open(p, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600 if private else 0o644), 'w') as f:
        f.write('\n'.join(lines + [f'{key}={value}']) + '\n')

put('.env.production', 'VITE_TURNSTILE_SITEKEY', w['sitekey'])
put('.prod.vars', 'TURNSTILE_SECRET', w['secret'], private=True)
print(('found' if found else 'created'), NAME, w['domains'], w['mode'], 'sitekey', w['sitekey'], '(secret in .prod.vars)')
