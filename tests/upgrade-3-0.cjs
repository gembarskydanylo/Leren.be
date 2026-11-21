// LerenBe 3.0 integration · real Service Worker upgrade from the current production release (PREV, default origin/main =
// release 226) to this tree (LerenBe 3.0), for six learner profiles. Chromium on localhost (emulated phone), no network,
// no Firebase, no AI. Per profile: install PREV, build the learner's data with PREV's own code, snapshot every leren_* /
// poly_* key and the visible numbers (XP, finished lessons, LIFE XP); deploy this tree → update bar (no automatic reload) →
// one tap → this release; then every key must be byte-for-byte the same, except the release bookkeeping keys in CHANGES
// (and new keys the new release adds), and the visible numbers must be equal. Finally offline: home and a lesson open.
// Profiles: new learner, half a course, a lot of progress, damaged storage, learner who studied offline, learner back
// after a long break.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), os = require('node:os'), assert = require('node:assert/strict'), {execSync} = require('node:child_process');
const repo = path.join(__dirname, '..'), PREV = process.env.PREV || 'origin/main';
const cacheOf = s => (s.match(/const CACHE_NAME = "(leren-be-v\d+)"/) || [])[1];
// release bookkeeping and clock-driven keys: allowed to change during an upgrade
const CHANGES = /^(leren_release_seen|leren_upd_done|leren_sync_at|leren_sync_base|leren_sync_backup|leren_persist_asked|seeded)$/;
(async () => {
 try { execSync(`git -C "${repo}" rev-parse --verify ${PREV}`, {stdio: 'ignore'}) } catch { console.log('SKIP: ' + PREV + ' not available (shallow clone?)'); return }
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: Playwright is not installed'); return }
 const prevRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lerenbe-prev-'));
 execSync(`git -C "${repo}" archive ${PREV} | tar -x -C "${prevRoot}"`, {maxBuffer: 1 << 30});
 const prevCache = cacheOf(fs.readFileSync(path.join(prevRoot, 'sw.js'), 'utf8')), curCache = cacheOf(fs.readFileSync(path.join(repo, 'sw.js'), 'utf8'));
 assert.notEqual(prevCache, curCache, 'the new release has its own cache name');
 assert(+curCache.replace(/\D/g, '') > +prevCache.replace(/\D/g, ''), curCache + ' is above ' + prevCache);
 let root = prevRoot, offline = false;
 const T = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.tsv': 'text/plain'};
 const server = http.createServer((q, r) => { if (offline) { q.socket.destroy(); return }
  let f = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() }
  r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); r.setHeader('cache-control', 'no-cache'); fs.createReadStream(f).pipe(r) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const B = 'http://localhost:' + server.address().port + '/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const BASE = {poly_ui: 'uk', leren_home_v1: 'path', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_tour_done: 'true', leren_level_asked: '1'};
 // each profile: storage before PREV starts, then actions with PREV's code
 const PROFILES = {
  'new learner': {seed: {}, act: async () => {}},
  'half a course': {seed: BASE, act: async p => p.evaluate(() => { for (let i = 0; i < 12; i++) addXP(10, 'q:' + i); const m = learningPath.model; m.start(); const ls = m.course.chapters.flatMap(c => c.lessons || []).slice(0, 6); for (const l of ls) m.state.completed[l.id] = (l.ids || [1]).length; m.save() })},
  'a lot of progress': {seed: {...BASE, poly_streak: '23', poly_toetsbest: JSON.stringify({t1: 9, t2: 10, t3: 8}), leren_life_xp_v1: JSON.stringify({'first-day:station': 40, 'first-day:tram': 35, 'fence-neighbour:mark-1': 20}), leren_achievements_v1: JSON.stringify({first: 1, ten: 1, streak7: 1}), leren_exam11: JSON.stringify({best: 86, done: 1})},
   act: async p => p.evaluate(() => { for (let i = 0; i < 400; i++) addXP(5 + (i % 7), 'big:' + i); const m = learningPath.model; m.start(); const ls = m.course.chapters.flatMap(c => c.lessons || []).slice(0, 40); for (const l of ls) m.state.completed[l.id] = (l.ids || [1]).length; m.save() })},
  'damaged storage': {seed: {...BASE, poly_score: 'abc', leren_xp_v2: '{bad json', leren_path_v1: 'null', poly_progress: '[1,2', leren_life_xp_v1: '"x"', leren_skills_v2: '<img src=x onerror=alert(1)>', leren_minutes_v2: '-5'}, act: async () => {}},
  'studied offline': {seed: BASE, offline: true, act: async p => p.evaluate(() => { for (let i = 0; i < 8; i++) addXP(10, 'off:' + i); const m = learningPath.model; m.start(); const l = m.recommended(); m.state.completed[l.id] = l.ids.length; m.save() })},
  'back after a long break': {seed: {...BASE, leren_release_seen: '"150"', poly_streak: '4', poly_daily: JSON.stringify({d: '2026-01-05', n: 3}), leren_week: JSON.stringify({w: '2026-01-05', d: [1, 1, 0]})}, act: async p => p.evaluate(() => { for (let i = 0; i < 30; i++) addXP(10, 'old:' + i) })},
 };
 const snap = page => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(leren_|poly_)/.test(k)) o[k] = localStorage.getItem(k) } return o });
 const visible = page => page.evaluate(() => ({xp: typeof score === 'number' ? score : null, lessons: Object.keys(globalThis.learningPath?.model?.state?.completed || {}).length,
  life: (() => { try { return Object.values(JSON.parse(localStorage.getItem('leren_life_xp_v1') || '{}')).reduce((a, b) => a + (+b || 0), 0) } catch { return 'invalid' } })()}));
 const results = [];
 try {
  for (const [name, P] of Object.entries(PROFILES)) {
   root = prevRoot; offline = false;
   const ctx = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true}), page = await ctx.newPage(), errors = [], navs = [];
   page.on('pageerror', e => errors.push(e.message)); page.on('framenavigated', f => { if (f === page.mainFrame()) navs.push(Date.now()) });
   await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
   await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, P.seed);
   await page.goto(B); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000}).catch(async () => { await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000}) });
   await page.waitForFunction(n => caches.keys().then(k => k.includes(n)), prevCache, {timeout: 120000});
   await page.waitForFunction(() => typeof addXP === 'function' && globalThis.learningPath?.model, null, {timeout: 30000});
   if (P.offline) { offline = true; await ctx.setOffline(true); await page.reload(); await page.waitForFunction(() => typeof addXP === 'function' && globalThis.learningPath?.model, null, {timeout: 30000}) }
   await P.act(page); await page.waitForTimeout(300);
   if (P.offline) { await ctx.setOffline(false); offline = false }
   const before = await snap(page), vb = await visible(page);
   // deploy this tree
   root = repo; const n0 = navs.length;
   await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
   await page.waitForFunction(n => caches.keys().then(k => k.includes(n)), curCache, {timeout: 180000});
   await page.waitForSelector('#updBar', {timeout: 60000}); assert.equal(navs.length, n0, name + ': no automatic reload');
   await page.click('#updBar .btn.primary'); await page.waitForLoadState('load');
   await page.waitForFunction(v => typeof RELEASE_VERSION === 'string' && RELEASE_VERSION === v, curCache.replace(/\D/g, ''), {timeout: 30000});
   await page.waitForFunction(() => typeof score === 'number' && globalThis.learningPath?.model, null, {timeout: 30000}); await page.waitForTimeout(800);
   const after = await snap(page), va = await visible(page);
   const changed = Object.keys(before).filter(k => !CHANGES.test(k) && before[k] !== after[k]);
   assert.deepEqual(changed.map(k => k + ': ' + String(before[k]).slice(0, 80) + ' → ' + String(after[k]).slice(0, 80)), [], name + ': learner data unchanged by the upgrade');
   assert.deepEqual(va, vb, name + ': XP, finished lessons and LIFE XP unchanged');
   await page.waitForFunction(n => caches.keys().then(k => k.length === 1 && k[0] === n), curCache, {timeout: 30000});
   // offline after the upgrade: home and a lesson
   offline = true; await ctx.setOffline(true); await page.reload(); await page.waitForFunction(() => typeof setView === 'function', null, {timeout: 30000});
   await page.evaluate(() => { lessonMode = 'quiz'; mode = 'quiz'; setView('lesson'); buildNav(); newRound() }); await page.waitForSelector('#card .opt', {timeout: 15000});
   assert.deepEqual(errors, [], name + ': no page errors');
   results.push(`${name} (XP ${vb.xp}, lessons ${vb.lessons}, LIFE ${vb.life}, ${Object.keys(before).length} keys)`);
   await ctx.close();
  }
  console.log(`PASS: upgrade ${prevCache} (${PREV}) → ${curCache} with a real worker, update bar + one tap, every learner key and XP / lessons / LIFE XP unchanged, offline home + lesson after — ` + results.join('; '));
 } finally { await browser.close(); server.close(); fs.rmSync(prevRoot, {recursive: true, force: true}) }
})().catch(e => { console.error(e); process.exit(1) });
