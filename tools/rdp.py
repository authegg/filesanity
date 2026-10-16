"""Just enough of Firefox's remote debugging protocol for tools/ext_check.py: install a temporary add-on (as web-ext
does) and evaluate an expression in its background page. Start Firefox with -start-debugger-server <port>."""
import json, socket, time

class RDP:
    def __init__(self, port):
        for _ in range(50):
            try:
                self.s = socket.create_connection(('127.0.0.1', port), timeout=60)
                break
            except OSError:
                time.sleep(.2)
        self.buf, self.console = b'', None
        self.recv()

    def recv(self):
        while b':' not in self.buf: self.buf += self.s.recv(65536)
        n, rest = self.buf.split(b':', 1)
        while len(rest) < int(n): rest += self.s.recv(65536)
        self.buf = rest[int(n):]
        return json.loads(rest[:int(n)])

    def send(self, to, type, **kw):
        d = json.dumps({'to': to, 'type': type, **kw}).encode()
        self.s.sendall(str(len(d)).encode() + b':' + d)

    def ask(self, to, type, want, **kw):
        self.send(to, type, **kw)
        while True:
            m = self.recv()
            if m.get('from') == to and (want in m or 'error' in m):
                if 'error' in m: raise RuntimeError(m)
                return m

    def install(self, path):
        root = self.ask('root', 'getRoot', 'addonsActor')
        return self.ask(root['addonsActor'], 'installTemporaryAddon', 'addon', addonPath=path)['addon']['id']

    def evaluate(self, addon_id, js):
        """Awaits js in the add-on's background page and returns its value, through JSON."""
        if not self.console:
            a = next(x for x in self.ask('root', 'listAddons', 'addons')['addons'] if x['id'] == addon_id)
            self.send(self.ask(a['actor'], 'getWatcher', 'actor')['actor'], 'watchTargets', targetType='frame')
            while not self.console:
                m = self.recv()
                if m.get('type') == 'target-available-form' and '_generated_background' in m['target'].get('url', ''):
                    self.console = m['target']['consoleActor']
        r = self.ask(self.console, 'evaluateJSAsync', 'resultID', text=f'(async () => JSON.stringify(await ({js})))()', mapped={'await': True})
        while True:
            m = self.recv()
            if m.get('type') == 'evaluationResult' and m.get('resultID') == r['resultID']:
                if m.get('exceptionMessage'): raise RuntimeError(m['exceptionMessage'])
                v = m['result']
                if isinstance(v, dict) and v.get('type') == 'longString':
                    v = self.ask(v['actor'], 'substring', 'substring', start=0, end=v['length'])['substring']
                return json.loads(v if isinstance(v, str) else 'null')  # undefined comes back as a grip
