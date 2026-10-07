#!/usr/bin/env python3
"""Agent Playbook smoke test.
1. Every quote (bookmark, persona, skill, Fleet Doctor) is re-found in its original source file.
2. Every pattern score equals its rubric sum; overall = mean; upgrades ranked 1..10 with S/M/L effort.
3. Every teaching post exists in the Bookmark Atlas with the same handle and URL.
4. Server on 127.0.0.1:4141 serves the page, JS, CSS and data.
5. The offline snapshot is self-contained and carries the same data.
6. Headless Chrome renders all chapters, quotes, rubric marks and upgrades from server and snapshot.
"""
import json, os, re, subprocess, sys, tempfile, shutil, urllib.request, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'build'))
from sources import quote_in, ATLAS, DOCTOR

fails, passes = [], 0
def check(ok, msg):
    global passes
    if ok: passes += 1
    else: fails.append(msg); print('FAIL', msg)

D = json.load(open(os.path.join(ROOT, 'data', 'playbook.json'), encoding='utf-8'))
atlas = {p['id']: p for p in json.load(open(ATLAS, encoding='utf-8'))['posts']}
SC = {'yes': 1, 'partial': 0.5, 'no': 0}
exp = lambda p: os.path.expanduser(p)

# 1-3: quotes, scores, posts
nq = 0
check(len(D['patterns']) >= 8, 'at least 8 patterns')
for p in D['patterns']:
    check(len(p['teach']) >= 2, f"{p['id']}: >=2 teaching posts")
    check(len(p['fleet']) >= 3, f"{p['id']}: >=3 fleet evidence items")
    check(bool(p['next'].strip()), f"{p['id']}: has try-this-next")
    check(len(p['rubric']) == 5, f"{p['id']}: 5 rubric checks")
    for r in p['rubric']:
        check(r['status'] in SC and r['because'].strip(), f"{p['id']}: rubric '{r['text']}' has status+justification")
    check(abs(sum(SC[r['status']] for r in p['rubric']) - p['score']) < 1e-9, f"{p['id']}: score == rubric sum")
    for t in p['teach']:
        nq += 1
        check(quote_in(t['quote'], t['sources']), f"{p['id']}: bookmark quote not in sources: {t['quote'][:60]}")
        a = atlas.get(t['post'])
        check(a is not None and a['handle'] == t['handle'] and a['url'] == t['url'], f"{p['id']}: post {t['post']} matches atlas")
        check(t['url'].startswith('https://x.com/'), f"{p['id']}: link ok")
    for e in p['fleet']:
        if e['kind'] == 'fact':
            check(bool(e['how']) and bool(e['source']), f"{p['id']}: fact has method+source")
            continue
        nq += 1
        check(quote_in(e['quote'], [exp(e['source'])]), f"{p['id']}: {e['kind']} quote not in {e['source']}: {e['quote'][:60]}")
        if e['kind'] == 'doctor': check(exp(e['source']) == DOCTOR, 'doctor source path')
ups = D['upgrades']
check([u['rank'] for u in ups] == list(range(1, 11)), 'upgrades ranked 1..10')
ids = {p['id'] for p in D['patterns']}
for u in ups:
    check(u['effort'] in ('S', 'M', 'L') and u['minutes'], f"upgrade {u['rank']} has effort estimate")
    check(all(x in ids for x in u['pattern']), f"upgrade {u['rank']} links to real patterns")
print(f'quotes re-verified against sources: {nq}')

# 4: server
def get(url):
    with urllib.request.urlopen(url, timeout=5) as r: return r.status, r.read().decode('utf-8', 'ignore')
for path in ['', 'app.js', 'style.css', 'data/playbook.json']:
    try:
        st, body = get('http://127.0.0.1:4141/' + path)
        check(st == 200 and len(body) > 200, f'port 4141 serves /{path}')
    except Exception as ex:
        check(False, f'port 4141 serves /{path}: {ex}')
try:
    check(json.loads(get('http://127.0.0.1:4141/data/playbook.json')[1]) == D, 'served data == data/playbook.json')
except Exception as ex: check(False, f'served data: {ex}')

# 5: snapshot
snap = os.path.join(ROOT, 'dist', 'agent-playbook-snapshot.html')
S = open(snap, encoding='utf-8').read()
check(not re.search(r'<(script|link|img)[^>]+(src|href)=["\'](?!#)', S), 'snapshot has no external src/href assets')
check('fetch("data/' in S and 'window.PLAYBOOK = ' in S, 'snapshot inlines data')
m = re.search(r'window\.PLAYBOOK = (.*?);</script>', S, re.S)
check(m and json.loads(m.group(1).replace('<\\/', '</')) == D, 'snapshot data == playbook.json')

# 6: render
chrome = shutil.which('google-chrome') or shutil.which('chromium')
def dom(url):
    prof = tempfile.mkdtemp(prefix='pb-smoke-')
    try:
        return subprocess.run([chrome, '--headless=new', '--no-sandbox', '--disable-gpu', f'--user-data-dir={prof}',
                               '--window-size=1440,900', '--virtual-time-budget=5000', '--dump-dom', url],
                              capture_output=True, text=True, timeout=90).stdout
    finally: shutil.rmtree(prof, ignore_errors=True)
for label, url in [('server', 'http://127.0.0.1:4141/'), ('snapshot', 'file://' + snap)]:
    h = re.sub(r'<script\b.*?</script>', '', dom(url), flags=re.S)  # count rendered DOM only, not inlined JS
    check('data-ready="1"' in h, f'{label}: app rendered')
    check(len(re.findall(r'<section class="chapter[^"]*" id="', h)) == len(D['patterns']), f'{label}: all chapters rendered')
    check(len(re.findall(r'class="r-spoke"', h)) == len(D['patterns']), f'{label}: radar has every spoke')
    check(len(re.findall(r'<li class="up"', h)) == 10, f'{label}: 10 upgrades rendered')
    check(len(re.findall(r'<span class="mark (yes|partial|no)"', h)) == 5 * len(D['patterns']), f'{label}: all rubric marks rendered')
    txt = html.unescape(h)
    shown = sum(1 for p in D['patterns'] for t in p['teach'] if t['quote'] in txt)
    check(shown == sum(len(p['teach']) for p in D['patterns']), f'{label}: every teaching quote shown verbatim ({shown})')

print(f'\n{passes} checks passed, {len(fails)} failed')
print('ALL PASS' if not fails else 'FAILURES')
sys.exit(1 if fails else 0)
