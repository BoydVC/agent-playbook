#!/usr/bin/env python3
"""Agent Playbook server: serves web/ and data/ on 127.0.0.1:4141 (read-only)."""
import os, sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('PORT', '4141'))

class H(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = path.split('?', 1)[0].split('#', 1)[0]
        if p.startswith('/data/'):
            return os.path.join(ROOT, 'data', os.path.basename(p))
        if p.startswith('/dist/'):
            return os.path.join(ROOT, 'dist', os.path.basename(p))
        self.directory = os.path.join(ROOT, 'web')
        return super().translate_path(path)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

if __name__ == '__main__':
    os.chdir(os.path.join(ROOT, 'web'))
    srv = ThreadingHTTPServer(('127.0.0.1', PORT), H)
    print(f'Agent Playbook on http://127.0.0.1:{PORT}/', flush=True)
    srv.serve_forever()
