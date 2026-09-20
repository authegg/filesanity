"""FileSanity Cloud under wrangler dev against a mock Lemon Squeezy: trial keys, quotas, a licence key, the webhook
signature and a signed clean-report. Run: python3 tools/cloud_check.py"""
import base64, hashlib, hmac, json, os, subprocess, sys, tempfile, threading, time, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fails = []
def check(c, m):
    print(('  ok   ' if c else '  FAIL ') + m)
    if not c: fails.append(m)

class MockLS(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length', 0))).decode()
        key = dict(p.split('=') for p in body.split('&')).get('license_key', '')
        good = key in ('lic_starter', 'lic_business')
        res = {'valid': good, 'error': None if good else 'license_key not found', 'license_key': {'status': 'active' if good else 'disabled'}, 'meta': {'store_id': 999, 'variant_id': 111 if key == 'lic_starter' else 222, 'customer_email': 'buyer@example.com'}}
        out = json.dumps(res).encode()
        self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(out))); self.end_headers(); self.wfile.write(out)

srv = HTTPServer(('127.0.0.1', 4199), MockLS)
threading.Thread(target=srv.serve_forever, daemon=True).start()

jwk = subprocess.run(['node', 'cloud/keygen.mjs'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
vars_ = {'LS_API_BASE': 'http://127.0.0.1:4199', 'LS_STORE_ID': '999', 'LS_WEBHOOK_SECRET': 'whsec_test', 'LS_VARIANT_STARTER': '111', 'LS_VARIANT_BUSINESS': '222', 'REPORT_PRIVATE_KEY_JWK': jwk}
state = tempfile.mkdtemp(prefix='fs-cloud-')
args = ['npx', 'wrangler', 'dev', '--port', '4197', '--local', '--persist-to', state]
for k, v in vars_.items(): args += ['--var', f'{k}:{v}']
wd = subprocess.Popen(args, cwd=os.path.join(ROOT, 'cloud'), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
BASE = 'http://127.0.0.1:4197'
for _ in range(60):
    try: urllib.request.urlopen(BASE + '/'); break
    except Exception: time.sleep(1)

def call(path, method='GET', body=None, headers=None, raw=False):
    req = urllib.request.Request(BASE + path, method=method, data=body, headers=headers or {})
    try:
        r = urllib.request.urlopen(req); data = r.read(); return r.status, dict(r.headers), (data if raw else json.loads(data or b'{}'))
    except urllib.error.HTTPError as e:
        data = e.read(); return e.code, dict(e.headers), (data if raw else json.loads(data or b'{}'))

try:
    st, h, page = call('/', raw=True)
    check(st == 200 and b'Free trial key' in page, 'the API page serves')
    st, h, j = call('/keys', 'POST', json.dumps({'email': 'a@example.com'}).encode(), {'Content-Type': 'application/json'})
    check(st == 201 and j.get('key', '').startswith('fs_trial_'), f'trial key issued ({st})')
    key = j.get('key', '')
    st, _, j = call('/keys', 'POST', json.dumps({'email': 'a@example.com'}).encode(), {'Content-Type': 'application/json'})
    check(st == 409, 'second trial for the same email refused')
    st, _, j = call('/keys', 'POST', json.dumps({'email': 'nope'}).encode(), {'Content-Type': 'application/json'})
    check(st == 400, 'bad email refused')
    st, _, j = call('/usage')
    check(st == 401, 'no key: 401')
    photo = open(os.path.join(ROOT, 'tests/files/photo.jpg'), 'rb').read()
    st, h, out = call('/clean?report=1', 'POST', photo, {'Authorization': f'Bearer {key}', 'X-Filename': 'photo.jpg', 'Content-Type': 'image/jpeg', 'Content-Length': str(len(photo))}, raw=True)
    check(st == 200 and h.get('X-FileSanity-Used') == '1/500' and h.get('X-FileSanity-Removed') == '52', f'trial clean counted ({st}, {h.get("X-FileSanity-Used")}, removed {h.get("X-FileSanity-Removed")})')
    rep = json.loads(base64.b64decode(h.get('X-FileSanity-Report', '')))
    check(rep.get('sha256_out') == hashlib.sha256(out).hexdigest() and rep.get('removed') == 52, 'report hashes the clean bytes')
    sig = h.get('X-FileSanity-Report-Signature', '')
    st, _, pub = call('/.well-known/filesanity-report-key')
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        pk = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(pub['x'] + '=='))
        pk.verify(base64.b64decode(sig), base64.b64decode(h['X-FileSanity-Report']))
        check(True, 'report signature verifies with the published key')
    except ImportError:
        check(bool(sig) and pub.get('crv') == 'Ed25519', 'report is signed (cryptography not installed, signature not verified)')
    st, _, j = call('/usage', headers={'Authorization': f'Bearer {key}'})
    check(j.get('used') == 1 and j.get('quota') == 500 and j.get('plan') == 'trial', f'usage reads 1/500 ({j})')
    st, h, _ = call('/inspect', 'POST', photo, {'Authorization': 'Bearer lic_starter', 'X-Filename': 'photo.jpg', 'Content-Length': str(len(photo))})
    check(st == 200 and h.get('X-FileSanity-Used') == '1/10000', f'licence key: starter quota ({h.get("X-FileSanity-Used")})')
    st, _, j = call('/usage', headers={'Authorization': 'Bearer lic_business'})
    check(j.get('plan') == 'business' and j.get('quota') == 100000, f'business licence resolves ({j})')
    st, _, j = call('/usage', headers={'Authorization': 'Bearer lic_nope'})
    check(st == 401, 'unknown licence refused')
    big = b'\xff\xd8\xff' + b'\0' * 26_000_000
    st, _, j = call('/clean', 'POST', big, {'Authorization': f'Bearer {key}', 'Content-Length': str(len(big))})
    check(st == 413, 'over the trial size cap: 413')
    body = json.dumps({'meta': {'event_name': 'license_key_updated'}, 'data': {'attributes': {'key': 'lic_starter'}}}).encode()
    st, _, _ = call('/webhooks/lemonsqueezy', 'POST', body, {'X-Signature': 'deadbeef'})
    check(st == 401, 'webhook with a bad signature refused')
    sig = hmac.new(b'whsec_test', body, hashlib.sha256).hexdigest()
    st, _, j = call('/webhooks/lemonsqueezy', 'POST', body, {'X-Signature': sig})
    check(st == 200 and j.get('ok'), 'webhook with the right signature accepted')
finally:
    wd.terminate(); srv.shutdown()
print('\nFAILED' if fails else '\nALL PASS', len(fails))
sys.exit(1 if fails else 0)
