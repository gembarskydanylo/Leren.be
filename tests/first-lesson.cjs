// TEST-019 · First run → first lesson (transferred from Leren.be-test, where it was checked on app/ with home v2).
// A brand-new learner chooses the explanation language and a daily goal, answers «How much Dutch do you know?» and
// lands in the real first A1.1 lesson («Починаю з нуля», or «Почати з основ» after «Знаю кілька слів» / «Можу трохи
// говорити») or in the optional starting check — never just on the home screen. The home shows «Your next lesson»
// first («Почати навчання» / «Продовжити навчання»), the daily-goal plan, levels in plain words with a CEFR note; games,
// AI and levels stay below. Existing learners never see the first run again; XP, finished lessons, language and goal
// are kept across reloads.
// TEST-050: the first run is Lexi's guided dialog and the home is «Сьогодні»; the same promises are checked there.
// Browser: Playwright Chromium, emulated 360/390/1280/1440 px — not a physical phone. SHOTS=<dir> saves screenshots.
// Run: node tests/first-lesson.cjs (the browser part is skipped without Playwright).
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');

(async () => {
 // ---- static
 const app = read('app.js'), lp = read('modules/learning-path/ui.js'), fh = read('modules/focused-home/ui.js');
 assert(/welcomeNl\(1\)/.test(app) && !/welcomeScreen\(\(\)=>\{\},null\)/.test(app), 'the Dutch first run is the 3-step flow, not the old welcome with an empty «Start»');
 assert(!/row\.children\.forEach/.test(app), 'goal buttons: no HTMLCollection.forEach (threw on 5/20 min)');
 for (const l of ['uk', 'en', 'fr', 'ar']) assert(new RegExp(l + ':\\{lang:"[^"]+",next:').test(app), 'first-run texts in ' + l);
 assert(/startFirst,startPlacement,refresh/.test(lp), 'learning path exposes startFirst/startPlacement');
 assert(/Починаю з нуля/.test(fh) && /Вивчаю основи/.test(fh) && /Спілкуюся в повсякденних ситуаціях/.test(fh) && /CEFR/.test(read('modules/home-v2/ui.js')), 'plain-words levels + CEFR note (LerenBe 3.0: in the home «Я вчу» picker)');
 assert(!/інтеграці|integration exam|inburgering/i.test(fh + lp), 'no level is tied to an integration exam');
 assert(/START_KEY="leren_start_known_v1"/.test(app) && !/localStorage\.clear|removeItem\("poly_score"|removeItem\("leren_path_v1"/.test(app.slice(app.indexOf('const ONB_UI'), app.indexOf('function firstRun'))), 'first run only adds its own key, removes nothing');
 const sw = read('sw.js'), html = read('index.html');
 for (const f of ['./modules/learning-path/ui.js?v=275', './modules/focused-home/ui.js?v=209', './modules/focused-home/style.css?v=263', './app.js?v=275']) { assert(sw.includes('"' + f + '"'), 'offline: ' + f); assert(html.includes(f), 'index: ' + f) }
 assert.equal(sw.match(/leren-be-v(\d+)/)[1], app.match(/RELEASE_VERSION="(\d+)"/)[1]);
 console.log('PASS: TEST-019 static — 3-step first run in 4 languages, start API, plain-words levels + CEFR, no exam link, versions');

 // ---- browser
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: browser part (Playwright is not installed)'); return }
 const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'};
 const server = http.createServer((req, res) => { let f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html'; if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end() } res.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const SHOTS = process.env.SHOTS, shot = async (page, name) => { if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'first-lesson-' + name + '.png')}) };
 const external = [], report = [];
 async function open(w, h, seed = null) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block'}), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1')) external.push(r.url()) });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  if (seed) await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, seed);
  await page.goto(base); return {ctx, page, errors};
 }
 const screen = page => page.evaluate(() => document.querySelector('#learningPath')?.dataset.screen);
 // TEST-050: the first run is Lexi's 5-step dialog (dialog.td-onb): course → name → goals → «how much do you know» → time.
 const step = async (page, n) => page.waitForSelector(`dialog.td-onb[data-step="${n}"]`, {timeout: 15000});
 const onb = (page, sel) => page.click('dialog.td-onb ' + sel);
 const ls = (page, k) => page.evaluate(k => localStorage.getItem(k), k);
 const noHScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
 const lessonTitle = page => page.locator('#learningPath h2').first().textContent();
 const toHome = async page => { await page.evaluate(() => { setView('path'); learningPath.home() }); await page.waitForSelector('#learningPath .td-home .td-start') };
 // steps 1–3 with defaults; returns on step 4 («Скільки нідерландської ти вже знаєш?»)
 async function toLevel(page) { await step(page, 1); await onb(page, '[data-action=next]'); await step(page, 2); await onb(page, '[data-action=next]'); await step(page, 3); await onb(page, '[data-action=next]'); await step(page, 4) }
 async function finishTime(page, goal) { await onb(page, '[data-action=next]'); await step(page, 5); if (goal) await onb(page, `[data-value="${goal}"]`); await onb(page, '[data-action=finish]') }
 async function firstLessonOpen(page, label) {
  await page.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'lesson', null, {timeout: 10000});
  assert.equal(await page.locator('dialog.td-onb').count(), 0, label + ': the first-run window is closed');
  assert.match(await lessonTitle(page), /Фрази та привітання · Частина 1\/5|Phrases|Частина 1/, label + ': the first A1.1 lesson');
  assert.match(await page.locator('#learningPath').textContent(), /hallo/, label + ': the lesson\'s first word');
  assert.equal(await page.evaluate(() => view), 'path', label + ': lesson view, not the home');
 }
 try {
  // ---- 1 brand-new learner, three answers, phone + desktop
  for (const [w, h, tag] of [[390, 844, 'mobile'], [1280, 800, 'desktop']]) {
   // «Починаю з нуля» → the first lesson right away
   {
    const {ctx, page, errors} = await open(w, h);
    await step(page, 1); await shot(page, tag + '-1-welcome');
    assert(await page.evaluate(() => { const r = document.querySelector('dialog.td-onb [data-action=next]').getBoundingClientRect(); return r.height >= 44 && r.bottom <= innerHeight }), tag + ': «Далі» big and visible');
    assert(await noHScroll(page), tag + ': step 1 fits');
    await toLevel(page); await shot(page, tag + '-2-knowledge');
    assert.match(await page.locator('dialog.td-onb h2').textContent(), /Скільки нідерландської ти вже знаєш\?|знаєш/);
    assert.equal(await page.locator('dialog.td-onb').getByText(/\bA1\b|\bA2\b/).count(), 0, 'no level codes in the question');
    await onb(page, '[data-value=zero]'); await onb(page, '[data-action=next]'); await step(page, 5);
    assert.equal(await page.getAttribute('dialog.td-onb [data-value="10"]', 'aria-checked'), 'true', 'default goal 10');
    await onb(page, '[data-value="5"]'); assert.equal(await page.getAttribute('dialog.td-onb [data-value="5"]', 'aria-checked'), 'true', '5 min selectable (no error)');
    assert.equal(await page.getAttribute('dialog.td-onb [data-value="10"]', 'aria-checked'), 'false');
    await onb(page, '[data-action=finish]'); await firstLessonOpen(page, 'zero/' + tag); await shot(page, tag + '-3-first-lesson');
    assert.equal(await ls(page, 'leren_goal_min'), '5'); assert.equal(await ls(page, 'leren_start_known_v1'), '"zero"');
    const t = JSON.parse(await ls(page, 'leren_today_v1')); assert.equal(t.steps.filter(s => s.kind === 'lesson').length, 1, '5 min: one lesson today');
    // reload in the middle of the lesson: no first run again, Today → «Продовжити» → the same lesson
    await page.locator('#learningPath .lp-primary').last().click().catch(() => {}); await page.waitForTimeout(300);
    await page.reload(); await page.waitForTimeout(1500);
    assert.equal(await page.locator('dialog.td-onb').count(), 0, 'no first run after reload');
    await toHome(page);
    assert.match(await page.locator('#learningPath .td-start').textContent(), /Продовжити/, 'started → «Продовжити»');
    await page.click('#learningPath .td-start'); await page.waitForTimeout(500);
    assert.equal(await screen(page), 'lesson', 'continue → back into the lesson'); assert.match(await lessonTitle(page), /Частина 1\/5/, 'the same first lesson');
    assert.deepEqual(errors, []); await ctx.close();
   }
   // «Знаю кілька слів» → «Пройти коротку перевірку» → the starting check (optional, not forced)
   {
    const {ctx, page, errors} = await open(w, h);
    await toLevel(page); await onb(page, '[data-value=some]'); await shot(page, tag + '-4-how-to-start');
    assert.deepEqual(await page.$$eval('dialog.td-onb .td-sub [data-value]', x => x.map(e => e.dataset.value)), ['test', 'basics'], 'check OR basics — no forced test');
    await onb(page, '[data-action=back]'); await step(page, 3); await onb(page, '[data-action=next]'); await step(page, 4);
    await onb(page, '[data-value=some]'); await onb(page, '.td-sub [data-value=test]'); await finishTime(page);
    await page.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'placement', null, {timeout: 10000});
    await shot(page, tag + '-5-start-check'); assert.equal(await ls(page, 'leren_start_known_v1'), '"words"'); assert.equal(await ls(page, 'leren_goal_min'), '10');
    assert.deepEqual(errors, []); await ctx.close();
   }
   // «Знаю кілька слів» → «Почати з основ» → the first lesson
   {
    const {ctx, page, errors} = await open(w, h);
    await toLevel(page); await onb(page, '[data-value=some]'); await onb(page, '.td-sub [data-value=basics]'); await finishTime(page, 20);
    await firstLessonOpen(page, 'some/basics/' + tag);
    assert.equal(await ls(page, 'leren_start_known_v1'), '"words"'); assert.equal(await ls(page, 'leren_goal_min'), '20');
    assert.deepEqual(errors, []); await ctx.close();
   }
   report.push('new learner ×3 answers (' + tag + ')');
  }
  // ---- 2 skip → straight into the first lesson; Today: one big «start» on the first screen; levels in plain words in «Навчання»
  for (const [w, h, tag] of [[360, 780, 'mobile'], [390, 844, 'mobile'], [1280, 800, 'desktop'], [1440, 900, 'desktop']]) {
   const {ctx, page, errors} = await open(w, h);
   await step(page, 1); await onb(page, '[data-action=skip]'); await firstLessonOpen(page, 'skip ' + w);
   await toHome(page);
   const m = await page.evaluate(() => { const b = document.querySelector('#learningPath .td-start').getBoundingClientRect(), dock = document.getElementById('modeButtons').getBoundingClientRect(); return {btn: b.bottom, h: b.height, limit: dock.height ? Math.min(dock.top, innerHeight) : innerHeight} });
   assert(m.btn <= m.limit && m.h >= 44, w + ': the start button is on the first screen (' + Math.round(m.btn) + ' ≤ ' + Math.round(m.limit) + ')');
   assert(!/інтеграці/i.test(await page.locator('#learningPath').textContent()), 'no exam link');
   await page.evaluate(() => openLearn()); await page.waitForSelector('.hv-pick-btn');
   for (const name of ['Починаю з нуля', 'Вивчаю основи', 'Спілкуюся в повсякденних ситуаціях']) assert.equal(await page.locator('#hvPickPanel .hv-level', {hasText: name}).count(), 1, name);
   assert.match(await page.locator('#hvPickPanel .hv-cefr').textContent(), /CEFR/);
   assert(await noHScroll(page), w + ': no horizontal scroll');
   await shot(page, tag + '-' + w + '-6-home-new');
   await toHome(page); await page.click('#learningPath .td-start'); await firstLessonOpen(page, 'home start ' + w);
   assert.deepEqual(errors, []); await ctx.close(); report.push('home ' + w);
  }
  // ---- 3 an existing learner: no first run; XP, finished lessons, language, goal kept; continue = the next lesson
  {
   const {ctx, page, errors} = await open(390, 844);
   await toLevel(page); await onb(page, '[data-value=zero]'); await finishTime(page); await firstLessonOpen(page, 'seed');
   const first = await page.evaluate(() => { const m = learningPath.model, id = m.state.session.lesson; m.state.completed[id] = 1; m.state.session = null; m.save(); return id });
   await page.evaluate(() => { localStorage.setItem('poly_score', '35'); localStorage.setItem('leren_goal_min', '10'); localStorage.setItem('poly_ui', 'en'); localStorage.removeItem('leren_today_v1') });
   const before = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('leren_path_v1')).completed));
   await page.reload(); await page.waitForTimeout(1500);
   assert.equal(await page.locator('dialog.td-onb').count(), 0, 'existing learner: no first run');
   await toHome(page);
   assert.match(await page.locator('#learningPath .td-start').textContent(), /Start learning|Continue/, 'progress → start button in English (interface language kept: en)');
   assert.equal(await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('leren_path_v1')).completed)), before, 'finished lessons kept');
   assert.equal(await ls(page, 'poly_score'), '35', 'XP kept'); assert.equal(await ls(page, 'leren_goal_min'), '10', 'goal kept');
   await shot(page, 'mobile-7-home-progress');
   await page.click('#learningPath .td-start'); await page.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'lesson', null, {timeout: 10000});
   const now = await page.evaluate(() => learningPath.model.state.session?.lesson); assert(now && now !== first, 'continue opens the next lesson, not the finished one');
   assert.match(await lessonTitle(page), /2\/5/, 'part 2 of the first topic');
   assert.deepEqual(errors, []); await ctx.close(); report.push('existing learner');
  }
  // ---- 4 explanation language in the first run (en) carries into the lesson and survives a reload
  {
   const {ctx, page, errors} = await open(390, 844);
   await step(page, 1); await page.selectOption('#tdOnbLang', 'en'); await step(page, 1);
   assert.match(await page.locator('dialog.td-onb h2').first().textContent(), /[A-Za-z]/); assert.doesNotMatch(await page.evaluate(() => { const c = document.querySelector('dialog.td-onb').cloneNode(true); c.querySelector('select')?.remove(); return c.textContent }), /[Ѐ-ӿ]{4}/, 'the first run is in English, course names too (language names in the picker stay native)');
   await onb(page, '[data-action=next]'); await step(page, 2); await onb(page, '[data-action=next]'); await step(page, 3); await onb(page, '[data-action=next]'); await step(page, 4);
   assert.match(await page.locator('dialog.td-onb h2').textContent(), /Dutch/);
   await onb(page, '[data-value=zero]'); await finishTime(page); await page.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'lesson');
   assert.match(await page.locator('#learningPath').textContent(), /hallo/); assert.match(await page.locator('#learningPath').textContent(), /hello|Hello|hi/i, 'English explanations');
   await page.reload(); await page.waitForTimeout(1200); assert.equal(await page.locator('dialog.td-onb').count(), 0);
   assert.equal(await page.evaluate(() => uiLang), 'en', 'language kept after reload');
   assert.deepEqual(errors, []); await ctx.close(); report.push('language en');
  }
  // production loads the Cloudflare analytics beacon (blocked here); nothing else may leave: no Firebase, no AI, no sync
  assert.deepEqual(external.filter(u => !u.startsWith('https://static.cloudflareinsights.com/')), [], 'no request to Firebase / AI / other hosts on the first run');
  console.log('PASS: TEST-019 browser (emulated) — ' + report.join(', '));
 } finally { await browser.close(); server.close() }
})().catch(e => { console.error(e); process.exit(1) });
