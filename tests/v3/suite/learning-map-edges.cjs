// TEST-020 Learning · independent audit: edge cases of the home route (the topic map of the active course).
// New user, one lesson, a partly and a fully finished topic, a finished course, broken saved data, switching
// A1.1 ↔ A1.2 ↔ A2 (no mixing of lessons between courses, XP untouched), a stop → its chapter map → back, reload,
// TEST-022 calm home (the list is folded until three lessons) and 44 px targets at 360/390/430/1280/1440.
// Browser: Playwright Chromium, emulated screens — not a physical phone. SHOTS=<dir> saves screenshots.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const repo = path.join(__dirname, '..'), root = path.join(repo, 'app'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
(async () => {
 // Static: the cached copies must change with the code (service worker serves ?v= files from its cache).
 const html = read('index.html'), sw = read('sw.js'), release = read('app.js').match(/RELEASE_VERSION="(\d+)"/)[1];
 for (const f of ['modules/home-v2/ui.js', 'modules/home-v2/style.css', 'modules/learning-path/ui.js']) {
  const v = html.match(new RegExp(f.replace(/[./]/g, '\\$&') + '\\?v=(\\d+)'))?.[1];
  assert(v && sw.includes('./' + f + '?v=' + v), f + ': index.html and sw.js name the same version');
 }
 assert.equal(sw.match(/leren-be-v(\d+)/)[1], release, 'cache name = release');
 assert(/routeOpen/.test(read('modules/learning-path/ui.js')) && /ctx\.routeOpen/.test(read('modules/home-v2/ui.js')), 'route follows the calm-home rule');
 console.log('PASS: static — versions of the changed files agree in index.html and sw.js, cache ' + release);
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: browser part (Playwright is not installed)'); return }
 const T = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json'};
 const server = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!f.startsWith(root) || !fs.existsSync(f)) { r.statusCode = 404; return r.end() } r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const B = 'http://127.0.0.1:' + server.address().port + '/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 // TEST-050: the home is «Сьогодні з Lexi»; the topic map of the active course lives in «Навчання» (tiles .fh-topic). Same edge cases.
 const learn = async page => { await page.waitForSelector('.td-home, #learningPath .fh-topic-grid'); await page.evaluate(() => openLearn()); await page.waitForSelector('#learningPath .fh-topic-grid .fh-topic') };
 const shot = async (page, name) => { if (process.env.SHOTS) await page.screenshot({path: path.join(process.env.SHOTS, 'route-' + name + '.png')}) };
 async function open(w, h, path_ = null) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block'}), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.addInitScript(([rel, p]) => { if (sessionStorage.getItem('seed')) return; sessionStorage.setItem('seed', '1'); localStorage.clear();
   for (const [k, v] of Object.entries({leren_release_seen: JSON.stringify(rel), poly_ui: 'uk', leren_home_v1: 'path', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', poly_score: '35'})) localStorage.setItem(k, v);
   if (p != null) localStorage.setItem('leren_path_v1', p) }, [release, path_]);
  await page.goto(B); await learn(page); return {ctx, page, errors};
 }
 const route = page => page.evaluate(() => { const tiles = [...document.querySelectorAll('#learningPath .fh-topic-grid .fh-topic')], id = t => (t.querySelector('img').getAttribute('src').match(/topics\/([^/]+)\.svg/) || [])[1];
  return {current: tiles.filter(t => t.getAttribute('aria-current') === 'step').map(id),
   stops: tiles.map(t => ({id: id(t), state: t.classList.contains('is-done') ? 'complete' : t.classList.contains('is-current') ? 'current' : t.classList.contains('is-started') ? 'started' : 'ahead', done: t.querySelector('progress').value, total: +t.querySelector('progress').max, label: t.querySelector('small').textContent}))} });
 const model = page => page.evaluate(() => { const m = learningPath.model; return {course: m.course, levels: m.levels, own: m.course && LerenLearningPath.catalog(DATA, LerenCurriculum).chapters.filter(c => c.level === m.course).map(c => c.id), stats: Object.fromEntries(m.levels.map(l => [l, m.courseStats(l)])), xp: localStorage.getItem('poly_score')} });
 // Marks lessons as finished through the engine's own state (as finish() does), then redraws «Навчання».
 const finish = async (page, pick) => { await page.evaluate(pick => { const m = learningPath.model, c = LerenLearningPath.catalog(DATA, LerenCurriculum); if (!m.state.started) m.start();
  for (const l of (f => c.lessons.filter(l => f(l, c)))(new Function('l', 'c', 'return ' + pick))) m.state.completed[l.id] = l.ids.length; m.state.session = null; m.save(); learningPath.home() }, pick); await learn(page) };
 const pick = async (page, level) => { await page.click('#learningPath .hv-pick-btn'); await page.click(`.hv-pick-panel .hv-level[data-level="${level}"]`); await page.waitForFunction(l => learningPath.model.course === l, level); await learn(page) };
 const report = [];
 try {
  // 1 · new user
  let {ctx, page, errors} = await open(390, 844);
  let r = await route(page), m = await model(page);
  assert.equal(m.course, 'A1.1'); assert.deepEqual(r.stops.map(s => s.id), m.own, 'map = chapters of the active course, in order');
  assert(r.stops.every(s => s.done === 0 && s.state !== 'complete'), 'new user: nothing done');
  assert.deepEqual(r.current, [m.own[0]], 'new user: «Зараз вивчаємо» on the first topic');
  for (const s of r.stops) assert.match(s.label, /^A1\.1 · 0 \/ \d+ /, 'tile counter: ' + s.label);
  await shot(page, '390-new');
  // 2 · one lesson → counted in its topic only; reload keeps it; XP is not touched by the map
  const first = await page.evaluate(() => LerenLearningPath.catalog(DATA, LerenCurriculum).lessons[0].id);
  await finish(page, `l.id===${JSON.stringify(first)}`); await page.reload(); await learn(page);
  r = await route(page); m = await model(page);
  assert.equal(r.stops[0].done, 1); assert.equal(r.stops[0].state, 'current'); assert(r.stops.slice(1).every(s => s.done === 0));
  assert.equal(m.xp, '35', 'XP untouched'); assert.equal(m.stats['A1.1'].done, 1); assert.equal(m.stats['A1.2'].done, 0, 'A1.2 untouched');
  await shot(page, '390-one-lesson');
  // 3 · whole first topic → ✓ and the current topic moves on
  await finish(page, `l.chapter===${JSON.stringify(m.own[0])}`); r = await route(page);
  assert.equal(r.stops[0].state, 'complete'); assert.equal(r.stops[0].done, r.stops[0].total); assert.deepEqual(r.current, [m.own[1]]);
  assert.match(await page.locator('#learningPath .fh-topic.is-done .fh-state').first().textContent(), /^✓/);
  const a11 = (await model(page)).stats['A1.1'];
  // 4 · a tile opens its own chapter map; back returns to the map with the same counts
  const stopTitle = await page.locator('#learningPath .fh-topic').nth(1).locator('.fh-topic-title').textContent();
  await page.locator('#learningPath .fh-topic').nth(1).click(); await page.waitForSelector('#learningPath .fh-lesson-row');
  assert.equal(await page.locator('.fh-map-heading h2').textContent(), stopTitle, 'a tile opens the map of that same topic');
  await page.click('.fh-back'); await page.waitForSelector('#learningPath .fh-topic-grid');
  assert.deepEqual((await model(page)).stats['A1.1'], a11, 'back: progress unchanged');
  // 5 · switch to A1.2 → only A1.2 topics, all at zero; A1.1 kept; back to A1.1 restores its map
  await pick(page, 'A1.2'); r = await route(page); m = await model(page);
  assert.deepEqual(r.stops.map(s => s.id), m.own); assert(r.stops.every(s => s.done === 0), 'A1.2 map has no A1.1 lessons'); assert.deepEqual(r.current, [m.own[0]]);
  assert.deepEqual(m.stats['A1.1'], a11, 'A1.1 progress kept after switching'); assert.equal(m.xp, '35');
  if (m.levels.includes('A2')) { await pick(page, 'A2'); r = await route(page); m = await model(page); assert.deepEqual(r.stops.map(s => s.id), m.own); assert(r.stops.every(s => s.done === 0));
   await page.click('#learningPath .hv-pick-btn'); assert.match(await page.locator('.hv-pick-panel .hv-level[data-level="A2"] small').textContent(), /^A2\.1 · /, 'A2 course is labelled A2.1'); await page.click('#learningPath .hv-pick-btn');
   await page.locator('#learningPath .fh-topic').first().click(); await page.waitForSelector('#learningPath .fh-lesson-row');
   assert.match(await page.locator('.fh-map-heading .fh-eyebrow').textContent(), /A2\.1/, 'A2 chapter map does not say «A1»');
   await page.click('.fh-back'); await page.waitForSelector('#learningPath .fh-topic-grid') }
  await pick(page, 'A1.1'); r = await route(page); assert.equal(r.stops[0].state, 'complete'); assert.deepEqual((await model(page)).stats['A1.1'], a11);
  await page.reload(); await learn(page); assert.deepEqual((await model(page)).stats['A1.1'], a11, 'reload keeps A1.1');
  // 6 · finished course: every tile ✓, no current topic, no errors
  await finish(page, `c.chapters.find(x=>x.id===l.chapter).level==='A1.1'`); r = await route(page);
  assert(r.stops.every(s => s.state === 'complete')); assert.deepEqual(r.current, []); assert.equal((await model(page)).stats['A1.2'].done, 0, 'finishing A1.1 leaves A1.2 at zero');
  await shot(page, '390-course-done');
  assert.deepEqual(errors, []); await ctx.close(); report.push('390: new → 1 lesson → topic → map/back → A1.2/A2 → A1.1 → reload → course done');
  // 7 · broken or foreign saved data: the map still draws from zero, no JS errors
  for (const bad of ['{broken', '[]', JSON.stringify({version: 1, completed: {'nope:x:0': 5, [first]: 'x'}, course: 'Z9'})]) {
   ({ctx, page, errors} = await open(390, 844, bad)); r = await route(page);
   assert(r.stops.length > 0 && r.stops.every(s => s.done === 0), 'bad save ' + bad.slice(0, 12) + ': zero map'); assert.equal(r.current.length, 1); assert.deepEqual(errors, []); await ctx.close();
  }
  report.push('broken saves: 3 variants → zero map, no errors');
  // 8 · five widths: no horizontal scroll, tiles and the picker are ≥ 44 px, keyboard focus is visible on a tile
  for (const [w, h] of [[360, 780], [390, 844], [430, 932], [1280, 800], [1440, 900]]) {
   ({ctx, page, errors} = await open(w, h)); await finish(page, 'c.lessons.indexOf(l)<3');
   const s = await page.evaluate(() => ({hscroll: document.documentElement.scrollWidth > innerWidth,
    small: [...document.querySelectorAll('#learningPath .fh-topic, #learningPath .hv-pick-btn, #learningPath .td-learn-row button')].filter(e => { const b = e.getBoundingClientRect(); return b.height < 44 || b.width < 44 }).map(e => e.textContent.slice(0, 20))}));
   assert(!s.hscroll, w + ': no horizontal scroll'); assert.deepEqual(s.small, [], w + ': targets ≥ 44 px');
   await page.locator('#learningPath .fh-topic').first().focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
   const outline = await page.evaluate(() => { const e = document.activeElement; return e.classList.contains('fh-topic') ? getComputedStyle(e).outlineStyle : 'not-a-tile' });
   assert.equal(outline, 'solid', w + ': keyboard focus is visible on a tile');
   if ([360, 1440].includes(w)) await shot(page, w + '-three-lessons');
   assert.deepEqual(errors, []); await ctx.close(); report.push(w + ': ok');
  }
 } finally { await browser.close(); server.close() }
 for (const line of report) console.log('  ' + line);
 console.log('PASS: map edge cases («Навчання») — courses kept apart, XP untouched, map/back, reload, broken saves, 5 widths');
})().catch(e => { console.error(e); process.exit(1) });
