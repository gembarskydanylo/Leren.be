// LerenBe 3.0 (PR #63) · an update 226 → 263 that is interrupted: the connection drops while the new Service Worker
// downloads the release, (A) in the app shell (the 7 critical files), (B) half-way through the other files. Chromium on
// localhost (emulated phone), real Service Worker, no network beyond localhost. Per case: install PREV (origin/main),
// build a learner with PREV's code, snapshot every leren_* / poly_* key; deploy this tree with a connection that dies
// after N requests; then offline: the app opens with home and a lesson, XP and keys unchanged; then online again: the
// update completes (update bar + one tap), the learner keys are unchanged, and every first-screen file is cached so the
// app opens offline again.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), os = require('node:os'), assert = require('node:assert/strict'), {execSync} = require('node:child_process');
const repo = path.join(__dirname, '..'), PREV = process.env.PREV || 'origin/main';
const cacheOf = s => (s.match(/const CACHE_NAME = "(leren-be-v\d+)"/) || [])[1];
// release bookkeeping, clocks, and leren_banner_last (the home banner picked at random on every page load; not synced: SYNC_SKIP)
const CHANGES = /^(leren_release_seen|leren_upd_done|leren_sync_at|leren_sync_base|leren_sync_backup|leren_persist_asked|leren_banner_last|seeded)$/;
(async () => {
 try { execSync(`git -C "${repo}" rev-parse --verify ${PREV}`, {stdio: 'ignore'}) } catch { console.log('SKIP: ' + PREV + ' not available (shallow clone?)'); return }
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: Playwright is not installed'); return }
 const prevRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lerenbe-prev-'));
 execSync(`git -C "${repo}" archive ${PREV} | tar -x -C "${prevRoot}"`, {maxBuffer: 1 << 30});
 const prevCache = cacheOf(fs.readFileSync(path.join(prevRoot, 'sw.js'), 'utf8')), curCache = cacheOf(fs.readFileSync(path.join(repo, 'sw.js'), 'utf8'));
 const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
 const swc = {self: {addEventListener() {}, location: {origin: 'http://x'}}, console, URL}; require('node:vm').createContext(swc); require('node:vm').runInContext(fs.readFileSync(path.join(repo, 'sw.js'), 'utf8') + ';this.F = APP_FILES', swc); const APP = [...swc.F];
 const firstScreen = [...html.matchAll(/<(?:script src|link rel="stylesheet" href)="\.\/([^"]+)"/g)].map(m => m[1]);
 let root = prevRoot, budget = Infinity, served = 0;
 const T = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.tsv': 'text/plain'};
 const server = http.createServer((q, r) => {
  if (served >= budget) { q.socket.destroy(); return } served++;
  let f = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() }
  r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); r.setHeader('cache-control', 'no-cache'); fs.createReadStream(f).pipe(r) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const B = 'http://localhost:' + server.address().port + '/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const SEED = {poly_ui: 'uk', leren_home_v1: 'path', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_tour_done: 'true', leren_level_asked: '1',
  poly_streak: '12', leren_life_xp_v1: JSON.stringify({'first-day:station': 40}), leren_achievements_v1: JSON.stringify({first: 1}), leren_exam11: JSON.stringify({best: 86, done: 1})};
 const snap = page => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(leren_|poly_)/.test(k)) o[k] = localStorage.getItem(k) } return o });
 const grows = (k, a, b) => { if (k !== 'leren_achievements_v1') return false; try { const x = JSON.parse(a).earned || {}, y = JSON.parse(b).earned || {}; return Object.entries(x).every(([id, d]) => y[id] === d) } catch { return false } };
 const same = (before, after, what) => assert.deepEqual(Object.keys(before).filter(k => !CHANGES.test(k) && before[k] !== after[k] && !grows(k, before[k], after[k])).map(k => k + ': ' + String(before[k]).slice(0, 60) + ' → ' + String(after[k]).slice(0, 60)), [], what);
 const results = [];
 try {
  for (const [name, drop] of [['A: drops in the app shell', 4], ['B: drops half-way through the release', 400]]) {
   root = prevRoot; budget = Infinity; served = 0;
   const ctx = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true}), page = await ctx.newPage(), errors = [];
   page.on('pageerror', e => errors.push(e.message)); await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
   await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, SEED);
   await page.goto(B); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000}).catch(async () => { await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000}) });
   await page.waitForFunction(n => caches.keys().then(k => k.includes(n)), prevCache, {timeout: 120000}); await page.reload();
   await page.waitForFunction(() => typeof addXP === 'function' && typeof setView === 'function', null, {timeout: 30000});
   await page.evaluate(() => { for (let i = 0; i < 50; i++) addXP(10, 'int:' + i) }); await page.waitForTimeout(300);
   const before = await snap(page), xp = await page.evaluate(() => score);
   // deploy this tree over a connection that dies after `drop` requests
   root = repo; served = 0; budget = drop;
   await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()).catch(() => {}));
   await page.waitForTimeout(8000);
   const state = await page.evaluate(async n => { const r = await navigator.serviceWorker.getRegistration(), k = await caches.keys(), c = k.includes(n) ? await (await caches.open(n)).keys() : [];
    return {keys: k, newEntries: c.length, active: r.active && r.active.scriptURL, waiting: !!r.waiting, installing: !!r.installing} }, curCache);
   // offline now: the app must open with the learner's data, whatever state the update stopped in
   budget = 0; await ctx.setOffline(true); await page.reload(); await page.waitForFunction(() => typeof setView === 'function' && typeof score === 'number', null, {timeout: 30000});
   await page.evaluate(() => { lessonMode = 'quiz'; mode = 'quiz'; setView('lesson'); buildNav(); newRound() }); await page.waitForSelector('#card .opt', {timeout: 15000});
   const mid = await snap(page), xpMid = await page.evaluate(() => score);
   same(before, mid, name + ': learner data unchanged after the interrupted update'); assert.equal(xpMid, xp, name + ': XP unchanged');
   const relMid = await page.evaluate(() => RELEASE_VERSION);
   // online again: the update completes
   await ctx.setOffline(false); budget = Infinity; served = 0;
   await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()).catch(() => {}));
   await page.waitForFunction(n => caches.keys().then(k => k.length === 1 && k[0] === n), curCache, {timeout: 180000});
   if (relMid !== curCache.replace(/\D/g, '')) { await page.waitForSelector('#updBar', {timeout: 60000}); await page.click('#updBar .btn.primary'); await page.waitForLoadState('load') } else { await page.reload() }
   await page.waitForFunction(v => typeof RELEASE_VERSION === 'string' && RELEASE_VERSION === v && typeof score === 'number', curCache.replace(/\D/g, ''), {timeout: 30000}); await page.waitForTimeout(800);
   const after = await snap(page); same(before, after, name + ': learner data unchanged after the completed update'); assert.equal(await page.evaluate(() => score), xp, name + ': XP unchanged at the end');
   const missing = await page.evaluate(async ([n, files]) => { const c = await caches.open(n), out = []; for (const f of files) if (!(await c.match('./' + f.replace(/^\.\//, '')))) out.push(f); return out }, [curCache, firstScreen]);
   assert.deepEqual(missing, [], name + ': every first-screen file is in the ' + curCache + ' cache');
   // the worker fills the holes the interrupted download left (sw.js healCache): every release file is cached again. The
   // browser may stop a background download after ≈ 30 s; the next page load continues it (the learner opens the app again).
   let holes = APP; for (let i = 0; i < 90 && holes.length; i++) { await page.waitForTimeout(1000); if (i % 15 === 14) { await page.reload(); await page.waitForTimeout(500) } holes = await page.evaluate(async ([n, files]) => { const c = await caches.open(n), out = []; for (const f of files) if (!(await c.match(f))) out.push(f); return out }, [curCache, APP]) }
   assert.deepEqual(holes.slice(0, 10), [], name + ': the release cache has no holes (' + holes.length + ' of ' + APP.length + ' files missing)');
   budget = 0; await ctx.setOffline(true); await page.reload(); await page.waitForFunction(() => typeof setView === 'function', null, {timeout: 30000});
   await page.evaluate(() => { lessonMode = 'quiz'; mode = 'quiz'; setView('lesson'); buildNav(); newRound() }); await page.waitForSelector('#card .opt', {timeout: 15000});
   assert.deepEqual(errors, [], name + ': no page errors');
   results.push(`${name}: stopped with caches [${state.keys.join(', ')}] (${state.newEntries} files of ${curCache}), offline it opened release ${relMid} with XP ${xpMid}; online again → ${curCache}, keys and XP unchanged, all ${APP.length} release files cached again, offline OK`);
   await ctx.close();
  }
  console.log('PASS: interrupted update ' + prevCache + ' → ' + curCache + ' — ' + results.join(' | '));
 } finally { await browser.close(); server.close(); fs.rmSync(prevRoot, {recursive: true, force: true}) }
})().catch(e => { console.error(e); process.exit(1) });
