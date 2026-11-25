// Rollback drill: production 264 → release candidate 273 → rollback build 274 (= the 264 code with its own cache name and
// the two keys 273 keeps on the device) → 273 again. Real Service Worker, Chromium on localhost (emulated phone), no network,
// no Firebase, no AI. Each move is the update bar + one tap, as a learner sees it.
// After the rollback: every learner key 273 left is still there byte for byte (nothing deleted, nothing rewritten), XP and
// finished lessons are equal, the 264 interface works online and offline, there is only the rollback cache, and the name /
// today's plan written by 273 are neither synced nor put in a backup file. After rolling forward again the 273 Today, the name
// and the progress are back.
// OLD / NEW are git refs (defaults: the 264 merge commit and the 273 RC commit); the rollback build is this tree.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), os = require('node:os'), assert = require('node:assert/strict'), {execSync} = require('node:child_process');
const repo = path.join(__dirname, '..');
const OLD = process.env.OLD || '1312d866fdc28c22302ca977c2845f79ef128d1f', NEW = process.env.NEW || 'af4002b8a84de34b92c95bec0423a598710ce1cd';
const cacheOf = s => (s.match(/const CACHE_NAME = "(leren-be-v\d+)"/) || [])[1];
// release bookkeeping and clock-driven keys: allowed to change when the release changes
const CHANGES = /^(leren_release_seen|leren_upd_done|leren_sync_at|leren_sync_base|leren_sync_backup|leren_persist_asked)$/;
const DEVICE_ONLY = ['leren_learner_name', 'leren_today_v1'];
(async () => {
 for (const ref of [OLD, NEW]) try { execSync(`git -C "${repo}" cat-file -e ${ref}^{commit}`, {stdio: 'ignore'}) } catch { console.log('SKIP: ' + ref + ' not available (shallow clone?)'); return }
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: Playwright is not installed'); return }
 const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lerenbe-rollback-')), R = {old: path.join(tmp, 'old'), new: path.join(tmp, 'new'), back: repo};
 for (const [k, ref] of [['old', OLD], ['new', NEW]]) { fs.mkdirSync(R[k]); execSync(`git -C "${repo}" archive ${ref} | tar -x -C "${R[k]}"`, {maxBuffer: 1 << 30}) }
 const C = Object.fromEntries(Object.entries(R).map(([k, d]) => [k, cacheOf(fs.readFileSync(path.join(d, 'sw.js'), 'utf8'))]));
 assert.equal(C.old, 'leren-be-v264'); assert.equal(C.new, 'leren-be-v273'); assert.equal(C.back, 'leren-be-v274', 'the rollback build has its own cache name');
 const appBack = fs.readFileSync(path.join(repo, 'app.js'), 'utf8');
 for (const k of DEVICE_ONLY) assert(new RegExp('const SYNC_SKIP=new Set\\(\\[[^\\]]*"' + k + '"').test(appBack), 'rollback build keeps ' + k + ' on the device');
 let root = R.old, offline = false;
 const T = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg'};
 const server = http.createServer((q, r) => { if (offline) { q.socket.destroy(); return }
  let f = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() }
  r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); r.setHeader('cache-control', 'no-cache'); fs.createReadStream(f).pipe(r) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const B = 'http://localhost:' + server.address().port + '/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const snap = page => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(leren_|poly_)/.test(k)) o[k] = localStorage.getItem(k) } return o });
 const visible = page => page.evaluate(() => ({xp: typeof score === 'number' ? score : null, lessons: (() => { try { return Object.keys(JSON.parse(localStorage.getItem('leren_path_v1') || '{}')?.completed || {}).length } catch { return 'invalid' } })()}));
 const ready = page => page.waitForFunction(() => typeof score === 'number' && typeof setView === 'function', null, {timeout: 30000});
 // deploy a tree, wait for its worker, then the learner taps «Оновити» once
 async function deploy(page, to, navs) {
  root = R[to]; const n0 = navs.length;
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  await page.waitForFunction(n => caches.keys().then(k => k.includes(n)), C[to], {timeout: 180000});
  await page.waitForSelector('#updBar', {timeout: 60000}); assert.equal(navs.length, n0, to + ': no automatic reload');
  await page.click('#updBar .btn.primary'); await page.waitForLoadState('load');
  await page.waitForFunction(v => typeof RELEASE_VERSION === 'string' && RELEASE_VERSION === v, C[to].replace(/\D/g, ''), {timeout: 30000});
  await ready(page); await page.waitForTimeout(800);
  await page.waitForFunction(n => caches.keys().then(k => k.length === 1 && k[0] === n), C[to], {timeout: 30000});
 }
 const BASE = {poly_ui: 'uk', leren_home_v1: 'path', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_tour_done: 'true', leren_level_asked: '1'};
 const PROFILES = {
  // studied in 264, kept studying in 273 (more lessons, a name, an English lesson, today's plan), then the rollback
  'learner since 264': {seed: BASE,
   in264: p => p.evaluate(() => { for (let i = 0; i < 10; i++) addXP(10, 'a:' + i); setView('path'); learningPath.open(); const m = learningPath.model; m.start(); const ls = LerenLearningPath.catalog(DATA, LerenCurriculum).lessons; for (const l of ls.slice(0, 2)) m.state.completed[l.id] = l.ids.length; m.save() }),
   in273: async p => { await p.evaluate(() => { for (let i = 0; i < 5; i++) addXP(10, 'b:' + i); const m = learningPath.model, ls = LerenLearningPath.catalog(DATA, LerenCurriculum).lessons; for (const l of ls.slice(2, 4)) m.state.completed[l.id] = l.ids.length; m.save();
     LerenGuided.setName(localStorage, 'Марія');
     const pack = LerenCourseData.en, c = LerenLearningPath.catalog(pack.data, pack.curriculum, {text: pack.text}), e = LerenLearningPath.create(c, localStorage, {key: LerenCourses.key('leren_path_v1', 'en')}); e.start(); e.state.completed[c.lessons[0].id] = c.lessons[0].ids.length; e.save();
     setView('path'); learningPath.home() });
    await p.waitForSelector('#learningPath .td-home .td-start', {timeout: 15000});
    // today's plan is written when the learner starts it; then ✕ back to Today
    await p.click('#learningPath .td-start'); await p.waitForFunction(() => localStorage.getItem('leren_today_v1'), null, {timeout: 10000});
    await p.evaluate(() => document.querySelector('#learningPath .fl-exit')?.click()) }},
  // first opened the app on 273: onboarding with a name, a lesson left half-way, then the rollback
  'new on 273': {seed: {poly_ui: 'uk'}, in264: async () => {},
   in273: async p => { await p.evaluate(() => { setView('path'); learningPath.home() }); await p.waitForSelector('dialog.td-onb[data-step="1"]', {timeout: 15000});
    await p.click('dialog.td-onb [data-action=next]'); await p.locator('dialog.td-onb input[type=text]').fill('Amélie'); await p.click('dialog.td-onb [data-action=next]');
    await p.click('dialog.td-onb [data-value=work]'); await p.click('dialog.td-onb [data-action=next]');
    await p.click('dialog.td-onb [data-value=zero]'); await p.click('dialog.td-onb [data-action=next]');
    await p.click('dialog.td-onb [data-value="10"]'); await p.click('dialog.td-onb [data-action=finish]');
    await p.waitForSelector('#learningPath .td-home .td-start', {timeout: 15000});
    await p.evaluate(() => { addXP(10, 'n:0'); const m = learningPath.model, ls = LerenLearningPath.catalog(DATA, LerenCurriculum).lessons; m.start(); m.state.completed[ls[0].id] = ls[0].ids.length;
     m.save() });
    await p.click('#learningPath .td-start'); await p.waitForFunction(() => localStorage.getItem('leren_today_v1') && learningPath.model.state.session, null, {timeout: 10000});
    await p.evaluate(() => document.querySelector('#learningPath .fl-exit')?.click()) }},
 };
 const results = [], notes = [];
 try {
  for (const [name, P] of Object.entries(PROFILES)) {
   root = R.old; offline = false;
   const ctx = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true}), page = await ctx.newPage(), errors = [], navs = [];
   page.on('pageerror', e => errors.push(e.message)); page.on('framenavigated', f => { if (f === page.mainFrame()) navs.push(Date.now()) });
   await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
   await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, P.seed);
   await page.goto(B); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000}).catch(async () => { await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000}) });
   await page.waitForFunction(n => caches.keys().then(k => k.includes(n)), C.old, {timeout: 120000}); await page.reload(); await ready(page);
   await P.in264(page); await page.waitForTimeout(300);
   // 264 → 273
   await deploy(page, 'new', navs); await page.waitForFunction(() => window.LerenGuided && window.learningPath, null, {timeout: 20000});
   await P.in273(page); await page.waitForTimeout(500);
   const before = await snap(page), vb = await visible(page);
   for (const k of DEVICE_ONLY) assert.ok(before[k], name + ': 273 wrote ' + k);
   assert.match(before.leren_learner_name, name === 'new on 273' ? /Amélie/ : /Марія/, name + ': the name is stored by 273');
   // 273 → rollback 274
   await deploy(page, 'back', navs);
   const after = await snap(page), va = await visible(page);
   // earned badges may only grow (same rule as the upgrade test): every badge keeps its date, a deserved one may be added
   const grows = k => { if (k !== 'leren_achievements_v1') return false; try { const a = JSON.parse(before[k]).earned || {}, b = JSON.parse(after[k]).earned || {}; return Object.entries(a).every(([id, d]) => b[id] === d) } catch { return false } };
   const lost = Object.keys(before).filter(k => !CHANGES.test(k) && before[k] !== after[k] && !grows(k));
   if (before.leren_achievements_v1 !== after.leren_achievements_v1 && grows('leren_achievements_v1')) notes.push(name + ': 264 added a deserved badge ' + Object.keys(JSON.parse(after.leren_achievements_v1).earned).filter(id => !(id in (JSON.parse(before.leren_achievements_v1).earned || {}))).join(', '));
   assert.deepEqual(lost.map(k => k + ': ' + String(before[k]).slice(0, 80) + ' → ' + String(after[k]).slice(0, 80)), [], name + ': every key 273 left is kept by the rollback');
   assert.deepEqual(va, vb, name + ': XP and finished lessons unchanged by the rollback');
   const priv = await page.evaluate(k => { const s = syncSnapshot(); let b = ''; try { b = JSON.stringify(LerenMerge.buildBackup(s)) } catch (e) { b = String(e) } return {sync: k.filter(x => x in s), backup: k.filter(x => b.includes(x))} }, DEVICE_ONLY);
   assert.deepEqual(priv, {sync: [], backup: []}, name + ': name and today plan are not synced and not in a backup after the rollback');
   // the 264 interface works: the route opens with the same finished lessons, a lesson opens, also offline
   await page.evaluate(() => { setView('path'); learningPath.open() }); await page.waitForTimeout(600);
   const rs = await page.evaluate(() => ({done: Object.keys(learningPath.model.state.completed).length, home: !!document.querySelector('#learningPath')?.children.length,
    dialogs: [...document.querySelectorAll('[role=dialog],dialog,.modal')].filter(d => d.getClientRects().length && !d.hidden).map(d => d.id || d.className).slice(0, 3)}));
   assert.equal(rs.done, vb.lessons, name + ': 264 route shows the same finished lessons'); assert.ok(rs.home, name + ': 264 route renders');
   if (rs.dialogs.length) notes.push(name + ': 264 opened ' + rs.dialogs.join(', '));
   offline = true; await ctx.setOffline(true); await page.reload(); await page.waitForFunction(() => typeof setView === 'function', null, {timeout: 30000});
   await page.evaluate(() => { lessonMode = 'quiz'; mode = 'quiz'; setView('lesson'); buildNav(); newRound() }); await page.waitForSelector('#card .opt', {timeout: 15000});
   await ctx.setOffline(false); offline = false;
   const mid = await snap(page);
   // rollback → 273 again (the fixed release): Today, the name and the progress are back
   await deploy(page, 'new', navs); await page.waitForFunction(() => window.LerenGuided && window.learningPath, null, {timeout: 20000});
   const again = await snap(page), vg = await visible(page);
   assert.deepEqual(vg, vb, name + ': XP and finished lessons after rolling forward');
   assert.equal(again.leren_learner_name, before.leren_learner_name, name + ': name kept through rollback and back');
   if (before['leren_path_v1@en']) assert.equal(again['leren_path_v1@en'], before['leren_path_v1@en'], name + ': English progress kept');
   await page.evaluate(() => { setView('path'); learningPath.home() }); await page.waitForSelector('#learningPath .td-home .td-start', {timeout: 15000});
   const start = (await page.locator('#learningPath .td-start').textContent()).trim();
   if (JSON.parse(before.leren_path_v1).session?.kind === 'lesson') { const s0 = JSON.parse(before.leren_path_v1).session, s1 = JSON.parse(mid.leren_path_v1 || 'null')?.session;
    notes.push(name + ': lesson left in 273 → after rollback ' + (s1?.lesson === s0.lesson ? 'still open' : 'session ' + JSON.stringify(s1)) + ' → on 273 again «' + start + '»') }
   assert.deepEqual(errors, [], name + ': no page errors');
   results.push(`${name} (XP ${vb.xp}, lessons ${vb.lessons}, ${Object.keys(before).length} keys)`);
   await ctx.close();
  }
  console.log(`PASS: rollback ${C.old} → ${C.new} → ${C.back} → ${C.new} with a real worker, update bar + one tap each way: every key kept, XP / lessons unchanged, name and today plan stay off sync and backups, 264 interface online + offline, 273 Today back after rolling forward — ${results.join('; ')}`);
  for (const n of notes) console.log(' - ' + n);
 } finally { await browser.close(); server.close(); fs.rmSync(tmp, {recursive: true, force: true}) }
})().catch(e => { console.error(e); process.exit(1) });
