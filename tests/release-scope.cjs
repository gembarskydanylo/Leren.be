// The rule behind tests/upgrade-3-0.cjs: which changed files need a new release (Service Worker cache name)?
// Every kind of app file does (HTML shell, JS, CSS, modules, data, media, fonts, web manifest, sw.js, precached pages
// and widgets, unknown files); tests, docs, CI, repo tooling, server-side config, store listings, crawler files and
// HTML pages outside the offline cache do not. Run: node tests/release-scope.cjs
const fs = require('node:fs'), assert = require('node:assert/strict');
const {precached, isAppChange} = require('./lib/release-scope.cjs');
const cached = precached(fs.readFileSync('sw.js', 'utf8'));
for (const f of ['index.html', 'app.js', 'boot.js', 'sw.js', 'course-curriculum.js', 'manifest.webmanifest', 'privacy.html', 'reviews.html', 'learn-life.html'])
 assert(cached.has(f) || f === 'sw.js', f + ' is in the offline list (or is the worker itself)');
const app = ['index.html', 'app.js', 'sw.js', 'manifest.webmanifest', 'boot.js', 'splash.js', 'course-curriculum.js', 'privacy.html', 'privacy-lang.js',
 'reviews.html', 'reviews.js', 'reviews.css', 'learn-life.html', 'learn-life-story.html', 'modules/clock/widget.html', 'modules/lexi/engine.js',
 'modules/design-system/foundation.css', 'dict/nl.json', 'img/topics/food.svg', 'audio/nl/x.m4a', 'fonts/nunito.woff', 'icon-192.png',
 'screenshots/1-chat.png', 'og-image.jpg', 'guides/lang.js', 'guides/style.css', 'assets/lerenbe-life/x.webp', 'something-new.txt'];
const other = ['tests/seo.cjs', 'tests/lib/app-source.cjs', 'docs/seo/GSC-FINDINGS-2026-11-26.md', 'audits/v174.md', 'README.md', 'INFRA.md',
 'README.txt', '.github/workflows/tests.yml', '.claude/skills/x/SKILL.md', 'graphify-out/graph.json', 'tools/ai-worker.js', 'wrangler.toml',
 'firestore.rules', 'firebase.json', 'robots.txt', 'sitemap.xml', 'CNAME', '.well-known/security.txt', 'store/store-listing.md',
 'guides/index.html', 'guides/nt2-dlia-pochatkivtsiv.html', '.gitignore'];
for (const f of app) assert.equal(isAppChange(f, cached), true, f + ' needs a release');
for (const f of other) assert.equal(isAppChange(f, cached), false, f + ' needs no release');
// A page the worker precaches counts even if it would otherwise look like a doc or crawler file.
assert.equal(isAppChange('robots.txt', new Set(['robots.txt'])), true, 'precached beats the no-release list');
console.log('PASS: release scope — ' + app.length + ' app files need a new cache name, ' + other.length + ' non-app files do not; ' + cached.size + ' precached paths count as app files');
