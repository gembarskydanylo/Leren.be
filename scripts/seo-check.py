#!/usr/bin/env python3
"""SEO sanity check: run from repo root. Exit 1 on failure."""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
sm = (root/'sitemap.xml').read_text(encoding='utf8')
urls = re.findall(r'<loc>https://lerenbe\.com/([^<]*)</loc>', sm)
home = (root/'index.html').read_text(encoding='utf8')
bad = []
for u in urls:
    f = root/(u or 'index.html')
    if not f.exists(): bad.append(f'{u}: file missing'); continue
    s = f.read_text(encoding='utf8')
    if len(re.findall(r'<h1[\s>]', s)) != 1: bad.append(f'{u}: need exactly one h1')
    for name, pat in [('title', r'<title>[^<]+</title>'), ('description', r'<meta name="description" content="[^"]{20,}"'),
                      ('canonical', r'<link rel="canonical" href="https://lerenbe\.com/'), ('og:title', r'property="og:title"')]:
        if not re.search(pat, s) and not (name == 'og:title' and u == ''):
            if not re.search(pat, s): bad.append(f'{u or "/"}: missing {name}')
    if re.search(r'noindex', s, re.I): bad.append(f'{u}: noindex')
    if u and u != 'privacy.html' and f'./{u}' not in home and f'/{u}' not in home: bad.append(f'{u}: not linked from home (orphan)')
print('\n'.join(bad) or f'OK: {len(urls)} URLs checked')
sys.exit(1 if bad else 0)
