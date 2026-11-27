// TEST-050 · Guided learning in the browser: first run → today's session → result; existing learners; name privacy;
// resume after reload; XP paid once; personalisation; offline (Service Worker); uk/en/fr/ar + RTL; phone widths.
// Browser: Playwright Chromium with emulated phone sizes — NOT a physical Samsung. SHOTS=<dir> saves screenshots.
// Run: node tests/test050-guided-browser.cjs (skipped without Playwright).
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
(async () => {
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: Playwright is not installed'); return }
 const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'};
 let offline = false;
 const server = http.createServer((req, res) => { if (offline) { req.socket.destroy(); return }
  let f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end() }
  res.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); res.setHeader('cache-control', 'no-cache'); fs.createReadStream(f).pipe(res) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const SHOTS = process.env.SHOTS, shot = async (page, name) => { if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'test050-' + name + '.png')}) };
 const aiCalls = [], external = [];
 const BASE = {poly_ui: 'uk', leren_welcome_seen: 'true', leren_tour_done: 'true', leren_level_asked: 'true', leren_start_known_v1: '"zero"', leren_release_seen: '"270"'};
 const EXISTING = {...BASE, poly_streak: '4', leren_goal_min: '15', leren_rec_voice: '"f"', leren_char: '"peter"', leren_path_v1: JSON.stringify({version: 1, started: true, completed: {'comm:phrases:0': 5}})};
 async function open({w = 390, h = 844, seed = null, sw = false} = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, serviceWorkers: sw ? 'allow' : 'block', hasTouch: true}), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { const u = r.url(); if (/workers\.dev|anthropic|leren-ai/.test(u)) aiCalls.push(u); if (!u.startsWith(base)) external.push(u) });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
  if (seed) await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, seed);
  // The app registers its Service Worker only on https: or «localhost» (the same holds on the phone: adb reverse + localhost).
  await page.goto(sw ? base.replace('127.0.0.1', 'localhost') : base); await page.waitForFunction(() => window.learningPath && window.LerenGuided, null, {timeout: 20000});
  return {ctx, page, errors};
 }
 const screen = p => p.evaluate(() => document.querySelector('#learningPath')?.dataset.screen);
 const ls = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
 const noHScroll = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
 const today = async p => JSON.parse(await ls(p, 'leren_today_v1') || 'null');
 const onb = (p, sel) => p.click('dialog.td-onb ' + sel);
 async function firstRun(p, {name = '', goal = 10, pace = 'balanced', start = 'zero'} = {}) {
  await p.waitForSelector('dialog.td-onb[data-step="1"]', {timeout: 10000}); await onb(p, '[data-action=next]');
  if (name) await p.fill('#tdOnbName', name); await onb(p, '[data-action=next]');
  await onb(p, '[data-value=belgium]'); await onb(p, '[data-action=next]');
  await onb(p, '[data-value=' + start + ']'); await onb(p, '[data-action=next]');
  await onb(p, '[data-value="' + goal + '"]'); await onb(p, '[data-value=' + pace + ']'); await onb(p, '[data-action=finish]');
 }
 // Jump to the last question of the open lesson, answer it right and leave the result to the session screens.
 async function finishLesson(p) {
  await p.waitForFunction(() => learningPath.model.state.session?.kind === 'lesson', null, {timeout: 10000});
  await p.evaluate(() => { const m = learningPath.model, s = m.state.session; s.phase = 2; s.index = s.ids.length - 1; s.answers = s.ids.slice(0, -1).map(() => true); m.save(); learningPath.open() });
  await p.click('#learningPath [data-action=start]'); await p.waitForSelector('#learningPath .lp-options button');
  await p.evaluate(() => { const w = learningPath.model.current(); [...document.querySelectorAll('#learningPath .lp-options button')].find(b => b.textContent === w.nl).click() });
  await p.locator('#learningPath .lp-primary').last().click();
 }
 async function finishTalk(p) {
  await p.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'talk', null, {timeout: 10000});
  for (let i = 0; i < 3; i++) {
   const sample = await p.evaluate(i => { const c = LerenLearningPath.catalog(DATA, LerenCurriculum), id = learningPath.model.state.session?.lesson || learningPath.model.lastDone?.() || ''; const t = JSON.parse(localStorage.getItem('leren_today_v1')); const les = t.steps.filter(s => s.kind === 'lesson' && s.lesson).at(-1).lesson; return LerenLessonConversation.SCENARIOS[c.lessons.find(l => l.id === les).chapter][i].sample }, i);
   await p.locator('#learningPath textarea, #learningPath input[type=text]').first().fill(sample);
   await p.locator('#learningPath .lc-card button[type=submit], #learningPath .lc-card .lp-primary').first().click();
   await p.locator('#learningPath .lp-primary').last().click();
  }
  await p.locator('#learningPath .lp-primary').first().click();
 }
 const report = [];
 try {
  // ---- 1 brand-new learner: first run with a name → session (lesson only) → result, XP once, resume after reload
  // RC rule (TEST-050): a conversation is offered only when the learner already knows ≥70 % of its words
  // (learningPath.talkReady). After 0 finished lessons the first chapter's talk is at ~10 %, so today = one lesson.
  {
   const {ctx, page, errors} = await open(); await page.waitForSelector('dialog.td-onb[data-step="1"]'); await shot(page, '01-first-run');
   assert(await page.evaluate(() => document.querySelector('dialog.td-onb [data-action=next]').getBoundingClientRect().height >= 48), 'big «next» button');
   await firstRun(page, {name: '  Марія  '});
   await page.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'lesson', null, {timeout: 10000});
   assert.equal(await page.evaluate(() => view), 'path', '«Почати» opens a lesson, not the catalogue');
   assert.deepEqual(JSON.parse(await ls(page, 'leren_learner_name')), {name: 'Марія', forAI: false}, 'name saved locally, no AI consent by default');
   const prof = JSON.parse(await ls(page, 'leren_profile_v1')); assert.deepEqual(prof.goals, ['belgium']); assert.equal(prof.source, 'new'); assert.equal(prof.namePrompt, 'done');
   let t = await today(page); assert.deepEqual(t.steps.map(s => s.kind), ['lesson'], 'new learner, 10 min: one lesson; no review yet, talk not ready (talk gate)');
   assert.equal(await page.evaluate(() => learningPath.talkReady(learningPath.model.recommended().id)), false, 'first conversation is above a brand-new learner');
   // reload in the middle of the lesson → the home says «continue» and goes back to the same lesson
   await page.reload(); await page.waitForFunction(() => window.learningPath); await page.waitForSelector('#learningPath .td-home');
   assert.equal(await page.locator('dialog.td-onb').count(), 0, 'first run is not shown again');
   assert.equal(await page.locator('#learningPath .td-today').getAttribute('data-mode') ?? await page.evaluate(() => document.querySelector('#learningPath [data-mode]')?.dataset.mode), 'resume');
   assert.match(await page.locator('#learningPath .td-hi').textContent(), /Марія/, 'greeting by name');
   await shot(page, '02-home-resume');
   await finishLesson(page);
   await page.waitForSelector('#learningPath .td-result'); await shot(page, '04-result');
   const xp1 = await page.evaluate(() => score); assert(xp1 > 0, 'lesson XP saved');
   t = await today(page); assert.equal(t.steps[0].done, true); assert.equal(t.paid.length, 1);
   const res = await page.locator('#learningPath .td-result').innerText();
   assert.match(res, /Марія/); assert.match(res, /XP/); assert.match(res, /Перший урок/, 'new achievement shown'); assert.match(res, /Частина 2\/5/, 'next recommended step');
   assert.equal(await page.locator('#learningPath .td-result [data-action=stop]').count(), 1, '«Завершити на сьогодні» offered');
   await page.reload(); await page.waitForFunction(() => window.learningPath); await page.waitForSelector('#learningPath .td-home');
   assert.equal(await page.evaluate(() => score), xp1, 'XP kept after reload'); t = await today(page); assert.equal(t.paid.length, 1, 'no second payment');
   // «Continue learning»: more steps today
   await page.click('#learningPath [data-action=start]');
   await page.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'lesson', null, {timeout: 10000});
   t = await today(page); assert.equal(t.round, 2); assert(t.steps.length >= 1);
   assert(await noHScroll(page)); assert.deepEqual(errors, []);
   // name privacy: not in the account snapshot, not in a backup, not in the URL
   const priv = await page.evaluate(() => ({snap: JSON.stringify(syncSnapshot()), url: location.href}));
   assert(!priv.snap.includes('Марія') && !priv.snap.includes('leren_learner_name') && !priv.snap.includes('leren_today_v1'), 'name and session stay on the device');
   assert(!priv.url.includes('%D0') && !priv.url.includes('Марія'));
   report.push('new learner: first run → lesson → result (talk gated) → continue; resume after 2 reloads; XP ' + xp1 + ' paid once');
   await ctx.close();
  }
  // ---- 1b learner with 3 lessons of the first chapter: talk is ready → lesson → step done → practice → result
  {
   const {ctx, page, errors} = await open({seed: {...BASE, leren_profile_v1: '{"v":1,"namePrompt":"done","goals":["belgium"],"source":"new"}', leren_goal_min: '10'}});
   await page.evaluate(() => { const m = learningPath.model, c = LerenLearningPath.catalog(DATA, LerenCurriculum); for (const l of c.lessons.filter(l => l.chapter === 'comm').slice(0, 3)) m.state.completed[l.id] = l.ids.length; m.state.started = true; m.save(); localStorage.removeItem('leren_today_v1') });
   await page.reload(); await page.waitForFunction(() => window.learningPath); await page.waitForSelector('#learningPath .td-home');
   assert(await page.evaluate(() => learningPath.talkReady(learningPath.model.recommended().id, true)), 'after 3 lessons the 4th lesson\'s talk is ready (forecast while planning, release 275)');
   await page.click('#learningPath [data-action=start]');
   let t = await today(page); assert.deepEqual(t.steps.map(s => s.kind), ['lesson', 'practice'], 'talk ready: lesson + practice');
   await finishLesson(page);
   await page.waitForSelector('#learningPath .td-step-done'); await shot(page, '03-step-done');
   const xp1 = await page.evaluate(() => score);
   await page.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'talk', null, {timeout: 6000});
   await page.reload(); await page.waitForFunction(() => window.learningPath); await page.waitForSelector('#learningPath .td-home');
   assert.equal(await page.evaluate(() => score), xp1, 'XP kept after reload'); t = await today(page); assert.equal(t.paid.length, 1, 'no second payment');
   await page.click('#learningPath [data-action=start]'); await finishTalk(page);
   await page.waitForSelector('#learningPath .td-result');
   assert.equal(await page.evaluate(() => score), xp1, 'practice adds no XP and nothing is paid twice');
   assert.deepEqual(errors, []); report.push('talk ready after 3 lessons: lesson → step done → practice (reload keeps XP) → result'); await ctx.close();
  }
  // ---- 2 skip the first run → still straight into a lesson; nothing personal saved
  {
   const {ctx, page, errors} = await open();
   await page.waitForSelector('dialog.td-onb[data-step="1"]'); await onb(page, '[data-action=skip]');
   await page.waitForFunction(() => document.querySelector('#learningPath')?.dataset.screen === 'lesson', null, {timeout: 10000});
   assert.equal(await ls(page, 'leren_learner_name'), null); assert.deepEqual(errors, []);
   report.push('skip: lesson opens, no name stored'); await ctx.close();
  }
  // ---- 3 existing learner without a name: no first run, one optional question, «Later» is final; progress untouched
  {
   const {ctx, page, errors} = await open({seed: EXISTING});
   await page.waitForSelector('#learningPath .td-home'); await page.waitForTimeout(900);
   assert.equal(await page.locator('dialog.td-onb').count(), 0, 'no first run for an existing learner');
   const before = await page.evaluate(() => { const o = {}; for (const k of Object.keys(localStorage)) if (!/^leren_(profile_v1|today_v1|learner_name|release_seen|upd_done|sync|persist)/.test(k)) o[k] = localStorage.getItem(k); return o });
   await page.waitForSelector('#learningPath [data-card=ask-name]'); await shot(page, '05-existing-ask');
   await page.locator('#learningPath [data-card=ask-name] [data-action=later]').click();
   await page.waitForFunction(() => !document.querySelector('#learningPath [data-card=ask-name]'));
   assert.equal(JSON.parse(await ls(page, 'leren_profile_v1')).namePrompt, 'later');
   await page.reload(); await page.waitForSelector('#learningPath .td-home'); await page.waitForTimeout(700);
   assert.equal(await page.locator('#learningPath [data-card=ask-name]').count(), 0, '«Later» is not asked again');
   const after = await page.evaluate(keys => Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])), Object.keys(before));
   for (const k of ['leren_path_v1', 'poly_streak', 'leren_goal_min', 'leren_rec_voice', 'leren_char', 'poly_ui']) assert.equal(after[k], before[k], 'unchanged: ' + k);
   const done = await page.evaluate(() => Object.keys(learningPath.model.state.completed).length); assert.equal(done, 1, 'finished lesson kept');
   assert.deepEqual(errors, []); report.push('existing, no name: no first run, ask once, «Later» final, path/streak/goal/voice unchanged'); await ctx.close();
  }
  // ---- 4 existing learner enters a name in the card; then edits and deletes it in Profile
  {
   const {ctx, page, errors} = await open({seed: EXISTING});
   await page.waitForSelector('#learningPath [data-card=ask-name]');
   await page.locator('#learningPath [data-card=ask-name] [data-action=name]').click();
   await page.locator('#learningPath [data-card=ask-name] input[type=text]').fill('<b>Ola</b>');
   await page.locator('#learningPath [data-card=ask-name] button[type=submit]').click();
   await page.waitForFunction(() => /Ola/.test(document.querySelector('#learningPath .td-hi')?.textContent || ''));
   assert.equal(JSON.parse(await ls(page, 'leren_learner_name')).name, 'bOla/b', 'markup removed, text kept');
   assert.equal(await page.locator('#learningPath .td-hi b').count(), 0, 'never rendered as HTML');
   await page.click('[data-tab=more]'); await page.click('dialog.td-more [data-more=profile]');
   await page.waitForSelector('dialog.td-profile'); await shot(page, '06-profile');
   await page.locator('dialog.td-profile input[type=text]').fill('Olena'); await page.click('dialog.td-profile [data-value=intensive]'); await page.click('dialog.td-profile [data-action=save-profile]');
   assert.equal(JSON.parse(await ls(page, 'leren_learner_name')).name, 'Olena'); assert.equal(JSON.parse(await ls(page, 'leren_profile_v1')).pace, 'intensive');
   assert.match(await page.locator('dialog.td-profile [role=status]').textContent(), /\S/, 'saved message');
   await page.click('dialog.td-profile .td-sheet-head .td-link'); await page.waitForFunction(() => !document.querySelector('dialog.td-profile[open]'));
   assert.match(await page.locator('#learningPath .td-hi').textContent(), /Olena/, 'home shows the edited name');
   await page.click('[data-tab=more]'); await page.click('dialog.td-more [data-more=profile]'); await page.click('dialog.td-profile [data-action=delete-name]');
   assert.equal(await ls(page, 'leren_learner_name'), null, 'name deleted');
   assert.deepEqual(errors, []); report.push('name: card → saved (cleaned) → edited in Profile → deleted'); await ctx.close();
  }
  // ---- 5 personalisation: goal 20 + intensive = 3 lessons; goal 5 + calm = 1 lesson. A new learner gets no practice (talk gate, see 1b)
  for (const [goal, pace, lessons, practice] of [[20, 'intensive', 3, false], [5, 'calm', 1, false]]) {
   const {ctx, page} = await open(); await firstRun(page, {goal, pace});
   await page.waitForFunction(() => localStorage.getItem('leren_today_v1'));
   const t = await today(page); assert.equal(t.steps.filter(s => s.kind === 'lesson').length, lessons, goal + '/' + pace);
   assert.equal(t.steps.some(s => s.kind === 'practice'), practice); assert.equal(await ls(page, 'leren_goal_min'), String(goal));
   report.push(`personalisation ${goal} min ${pace}: ${t.steps.map(s => s.kind).join(' → ')}`); await ctx.close();
  }
  // ---- 6 languages + RTL, phone widths: Today fits, no horizontal scroll
  const START = {uk: 'Почати навчання', en: 'Start learning', fr: 'Commencer', ar: 'ابدأ'};
  for (const lang of ['uk', 'en', 'fr', 'ar']) for (const [w, h] of [[320, 640], [360, 780], [390, 844], [412, 915], [430, 932]]) {
   const {ctx, page, errors} = await open({w, h, seed: {...EXISTING, poly_ui: lang, leren_learner_name: JSON.stringify({name: lang === 'ar' ? 'محمد' : 'Maria', forAI: false}), leren_profile_v1: '{"v":1,"namePrompt":"done"}'}});
   await page.waitForSelector('#learningPath .td-home'); await page.waitForTimeout(300);
   const m = await page.evaluate(() => { const home = document.querySelector('#learningPath .td-home'), b = home.querySelector('[data-action=start]').getBoundingClientRect(), dock = document.querySelector('.td-dock')?.getBoundingClientRect();
    return {dir: getComputedStyle(home).direction, text: home.innerText, start: home.querySelector('[data-action=start]').textContent, btnBottom: b.bottom, btnH: b.height, dockTop: dock ? dock.top : innerHeight, wide: document.documentElement.scrollWidth <= innerWidth,
     homeH: home.getBoundingClientRect().height, vh: innerHeight, tiles: home.querySelectorAll('[data-tile]').length, lexi: !!home.querySelector('[data-action=lexi]')} });
   const tag = `${lang} ${w}×${h}`;
   assert(m.wide, tag + ': no horizontal scroll'); assert.equal(m.dir, lang === 'ar' ? 'rtl' : 'ltr', tag + ': direction');
   assert(m.btnH >= 48, tag + ': big start button'); assert(m.btnBottom <= m.dockTop, tag + `: start button visible without scrolling (${Math.round(m.btnBottom)} ≤ ${Math.round(m.dockTop)})`);
   assert(m.homeH <= m.vh * 1.6, tag + `: Today is short (${Math.round(m.homeH)} px for a ${m.vh} px screen)`);
   assert(m.start.includes(START[lang]) || lang !== 'uk' && !/[Ѐ-ӿ]/.test(m.start), tag + ': start in the right language: ' + m.start);
   if (lang !== 'uk') assert(!/[Ѐ-ӿ]/.test(m.text), tag + ': no Ukrainian left on Today: ' + m.text.match(/.{0,20}[Ѐ-ӿ]+.{0,20}/)?.[0]);
   assert.equal(m.tiles, 3); assert(m.lexi, 'Lexi is visible'); assert.deepEqual(errors, []);
   if (w === 390 || w === 320) await shot(page, `07-home-${lang}-${w}`);
   await ctx.close();
  }
  report.push('uk/en/fr/ar × 320/360/390/412/430: start button above the dock, no horizontal scroll, RTL for ar');
  // ---- 6b course switch: «Learn» tab keeps the language + level choice; Today follows the chosen level
  {
   const {ctx, page, errors} = await open({seed: {...EXISTING, leren_profile_v1: '{"v":1,"namePrompt":"done"}'}});
   await page.waitForSelector('#learningPath .td-home');
   const t0 = await page.locator('#learningPath [data-tile=course]').innerText(); assert.match(t0, /A1\.1/);
   await page.click('[data-tab=learn]'); await page.locator('#learningPath .hv-pick-btn').click();
   await page.locator('#learningPath .hv-level[data-level="A1.2"]').click();
   await page.waitForFunction(() => learningPath.model.course === 'A1.2', null, {timeout: 5000});
   await page.click('[data-tab=today]'); await page.waitForSelector('#learningPath .td-home');
   assert.match(await page.locator('#learningPath [data-tile=course]').innerText(), /A1\.2/, 'Today shows the chosen level');
   await page.click('#learningPath [data-action=start]');
   await page.waitForFunction(() => ['lesson', 'review'].includes(document.querySelector('#learningPath')?.dataset.screen), null, {timeout: 10000});
   const t = await today(page); assert.equal(t.course, 'A1.2', 'the session belongs to A1.2');
   assert.equal(await page.evaluate(() => Object.keys(learningPath.model.state.completed).length), 1, 'A1.1 progress kept');
   assert.deepEqual(errors, []); report.push('course switch: Learn → «Я вчу» → A1.2 → Today and the session follow, A1.1 progress kept'); await ctx.close();
  }
  // ---- 7 offline: the Service Worker caches the release; with no network the home and a session still work
  {
   const {ctx, page, errors} = await open({sw: true, seed: EXISTING});
   await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000}).catch(async () => { await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000}) });
   const cache = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').match(/leren-be-v\d+/)[0];
   await page.waitForFunction(n => caches.keys().then(k => k.includes(n)), cache, {timeout: 120000});
   offline = true; await ctx.setOffline(true);
   await page.reload(); await page.waitForFunction(() => window.learningPath && window.LerenGuided, null, {timeout: 30000});
   await page.waitForSelector('#learningPath .td-home'); await shot(page, '08-offline-home');
   assert.equal(await page.evaluate(() => navigator.onLine), false);
   assert(await page.evaluate(() => { const i = document.querySelector('#learningPath .td-home img'); return !!i && i.complete && i.naturalWidth > 0 }), 'Lexi image from the cache');
   await page.click('#learningPath [data-action=start]');
   await page.waitForFunction(() => ['lesson', 'review'].includes(document.querySelector('#learningPath')?.dataset.screen), null, {timeout: 10000});
   const xp0 = await page.evaluate(() => score);
   if (await screen(page) === 'lesson') { await finishLesson(page); await page.waitForSelector('#learningPath .td-step-done'); assert(await page.evaluate(() => score) > xp0, 'XP offline') }
   offline = false; await ctx.setOffline(false);
   assert.deepEqual(errors.filter(e => !/Failed to fetch|NetworkError|ERR_INTERNET/.test(e)), []);
   report.push('offline: home, Lexi image and a lesson with XP work from the cache (' + cache + ')'); await ctx.close();
  }
  assert.deepEqual(aiCalls, [], 'no AI request while opening, onboarding or studying');
  console.log('PASS: TEST-050 browser (emulated Chromium, not a physical phone)\n - ' + report.join('\n - '));
 } finally { await browser.close(); server.close() }
})().catch(e => { console.error(e); process.exit(1) });
