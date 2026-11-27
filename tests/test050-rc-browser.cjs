// TEST-050 RC · Guided Learning release candidate checks in the browser (Playwright Chromium, emulated phone sizes —
// NOT a physical Samsung). Covers what the RC brief adds on top of test050-guided-browser / test050-focus-browser:
//  1 English and French, each on its own: first run → beta label from data → first lesson → XP → own progress key →
//    Dutch untouched → close → Today with the beta note → reload → next lesson of the same course; no mixing between EN/FR.
//  2 route priorities: unfinished lesson before review; due words → review first; then a new lesson.
//  3 talk gate: a conversation is offered only when ≥70 % of its words are known (A1.1 starts without it).
//  4 the end of a session: «Продовжити навчання» / «Завершити на сьогодні»; after a reload Lexi proposes the next step.
//  5 names in Ukrainian / French / English / Arabic scripts: shown once, isolated direction, never in sync or AI code.
//  6 regressions: dock labels not clipped at 320 px; «Запитай Lexi» on the focus study card and on the check screen.
// Run: node tests/test050-rc-browser.cjs (skipped without Playwright).
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
(async () => {
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: Playwright is not installed'); return }
 const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json'};
 const server = http.createServer((req, res) => {
  let f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end() }
  res.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); res.setHeader('cache-control', 'no-cache'); fs.createReadStream(f).pipe(res) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const release = fs.readFileSync(path.join(root, 'app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
 const aiCalls = [], report = [];
 const BASE = {poly_ui: 'uk', leren_welcome_seen: 'true', leren_tour_done: 'true', leren_level_asked: 'true', leren_start_known_v1: '"zero"', leren_release_seen: JSON.stringify(release)};
 const EXISTING = {...BASE, poly_streak: '2', poly_score: '50', leren_goal_min: '10', leren_profile_v1: JSON.stringify({v: 1, goals: ['belgium'], pace: 'balanced', namePrompt: 'done', source: 'existing'}),
  leren_path_v1: JSON.stringify({version: 1, started: true, completed: {'comm:phrases:0': 5}})};
 async function open({w = 390, h = 844, seed = null} = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block', hasTouch: true}), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/workers\.dev|anthropic|leren-ai/.test(r.url())) aiCalls.push(r.url()) });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
  if (seed) await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, seed);
  await page.goto(base); await page.waitForFunction(() => window.learningPath && window.LerenGuided, null, {timeout: 20000});
  return {ctx, page, errors};
 }
 const ls = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
 const today = async p => JSON.parse(await ls(p, 'leren_today_v1') || 'null');
 const reload = async p => { await p.reload(); await p.waitForFunction(() => window.learningPath && window.LerenGuided, null, {timeout: 20000}) };
 const waitScreen = (p, s) => p.waitForFunction(s => document.querySelector('#learningPath')?.dataset.screen === s, s, {timeout: 10000});
 // Marks the first n lessons of a Dutch chapter as done (a learner who already studied), and drops today's plan.
 const studied = (p, chapter, n) => p.evaluate(([chapter, n]) => { const m = learningPath.model, c = LerenLearningPath.catalog(DATA, LerenCurriculum); for (const l of c.lessons.filter(l => l.chapter === chapter).slice(0, n)) m.state.completed[l.id] = l.ids.length; m.state.started = true; m.save(); localStorage.removeItem('leren_today_v1') }, [chapter, n]);
 // Plays the open English/French player lesson with right answers until its result.
 async function playCourse(p, lang) {
  for (let guard = 0; guard < 60; guard++) {
   if (await p.locator('.cp-stage .cp-score').count()) return;
   const ask = await p.evaluate(lang => { const st = document.querySelector('.cp-stage'), opts = [...st.querySelectorAll('.cp-opt')]; if (!opts.length || st.querySelector('.cp-feedback')) return null;
    const id = st.dataset.card, phase = st.dataset.phase; for (const t of Object.values(LerenCourseData[lang].data)) for (const w of t.items) if (w.id === id) return phase === 'listen' ? w.uk : w[lang]; return '?' }, lang);
   if (ask) { assert.notEqual(ask, '?', 'card found in the course data'); await p.locator('.cp-stage .cp-opt', {hasText: ask}).first().click(); continue }
   await p.locator('.cp-stage .cp-primary').last().click();
  }
  throw new Error(lang + ': the lesson did not reach its result');
 }
 try {
  // ---- 1 English and French, each on its own
  for (const lang of ['en', 'fr']) {
   const other = lang === 'en' ? 'fr' : 'en';
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: {poly_ui: 'uk'}});
   await page.waitForSelector('dialog.td-onb[data-step="1"]', {timeout: 15000});
   const st = await page.evaluate(l => LerenCoursePlayer.status(l, 'uk'), lang);
   assert(st && st.beta && st.total > 0, lang + ': course status from data');
   const chip = await page.locator(`dialog.td-onb .td-courses [data-value="${lang}"]`).innerText();
   assert(chip.includes('Бета') && chip.includes(String(st.total)) && chip.includes(st.levels), lang + ': first-run chip says beta, the real lesson count and levels: ' + chip.replace(/\s+/g, ' '));
   assert.equal(st.levels, lang === 'en' ? '1.1–1.2' : '1.1', lang + ': levels come from the data (French has only 1.1)');
   await page.click(`dialog.td-onb .td-courses [data-value="${lang}"]`); await page.click('dialog.td-onb [data-action=next]');
   await page.click('dialog.td-onb [data-action=next]'); // no name: skipping it never blocks learning
   await page.click('dialog.td-onb [data-value=work]'); await page.click('dialog.td-onb [data-action=next]');
   await page.click('dialog.td-onb [data-value=zero]'); await page.click('dialog.td-onb [data-action=next]');
   await page.click('dialog.td-onb [data-value="10"]'); await page.click('dialog.td-onb [data-action=finish]');
   await page.waitForSelector(`.cp-stage[data-lang="${lang}"][data-phase]`, {timeout: 10000});
   assert.equal(await ls(page, 'leren_learner_name'), null, lang + ': name skipped, nothing stored');
   const xp0 = await page.evaluate(() => score);
   await playCourse(page, lang);
   assert.match(await page.locator('.cp-stage .cp-xp').textContent(), /^\+\d+ XP$/, lang + ': XP shown after the lesson');
   const xp1 = await page.evaluate(() => score); assert(xp1 > xp0, lang + ': XP added to the shared score');
   const keys = await page.evaluate(([l, o]) => ({own: JSON.parse(localStorage.getItem('leren_path_v1@' + l)), other: localStorage.getItem('leren_path_v1@' + o), nl: localStorage.getItem('leren_path_v1')}), [lang, other]);
   assert.equal(Object.keys(keys.own.completed).length, 1, lang + ': one lesson in its own key');
   assert.equal(keys.other, null, lang + ': the other foreign course is untouched'); assert.equal(keys.nl, null, lang + ': the Dutch route is untouched');
   await page.click('.cp-stage .cp-close'); await page.waitForSelector('#learningPath .td-home');
   const note = await page.locator('#learningPath .td-home [data-note=beta]').textContent();
   assert(note.includes(String(st.total)) && note.includes(st.levels) && /лише в нідерландському/.test(note), lang + ': Today says what the beta course does not have yet: ' + note);
   await reload(page); await page.waitForSelector('#learningPath .td-home');
   assert.equal(await page.evaluate(() => score), xp1, lang + ': XP kept after reload');
   assert.equal(await ls(page, 'leren_learn_lang'), lang, lang + ': course kept after reload');
   await page.click('#learningPath .td-start'); await page.waitForSelector(`.cp-stage[data-lang="${lang}"][data-phase]`);
   const done = Object.keys(JSON.parse(await ls(page, 'leren_path_v1@' + lang)).completed);
   assert.equal(done.length, 1, lang + ': progress kept'); assert.notEqual(await page.locator('.cp-stage').getAttribute('data-card'), null);
   // switch to the other course in «Навчання»: its own empty progress, this course's progress unchanged
   await page.click('.cp-stage .cp-close'); await page.evaluate(() => openLearn()); await page.waitForSelector('.hv-pick-btn');
   if (await page.locator('#hvPickPanel').isHidden()) await page.click('.hv-pick-btn');
   await page.click(`#hvPickPanel .hv-course[data-course="${other}"] button`); await page.waitForSelector(`.cp-stage[data-lang="${other}"]`);
   const after = await page.evaluate(([l, o]) => ({own: JSON.parse(localStorage.getItem('leren_path_v1@' + l)), other: JSON.parse(localStorage.getItem('leren_path_v1@' + o) || 'null')}), [lang, other]);
   assert.deepEqual(Object.keys(after.own.completed), done, lang + ': progress unchanged after switching to ' + other);
   assert.equal(Object.keys(after.other?.completed || {}).length, 0, other + ': starts empty, nothing copied from ' + lang);
   assert.deepEqual(errors, []); report.push(`${lang}: beta ${st.total} lessons (${st.levels}) from data → lesson → +${xp1 - xp0} XP → own key → reload resume → ${other} separate`); await ctx.close();
  }

  // ---- 2 route priorities: (1) unfinished lesson, (2) review of forgotten words, (3) new lesson
  {
   const {ctx, page, errors} = await open({seed: EXISTING});
   await studied(page, 'comm', 2);
   // six words seen and overdue → review is due
   await page.evaluate(() => { const c = LerenLearningPath.catalog(DATA, LerenCurriculum), ids = c.lessons.filter(l => l.chapter === 'comm').flatMap(l => l.ids).slice(0, 6), st = {};
    ids.forEach((id, i) => st[id] = {seen: 2, correct: 1, wrong: i === 0 ? 3 : 0, streak: 0, due: Date.now() - 864e5, known: false}); localStorage.setItem('poly_progress', JSON.stringify(st)) });
   await reload(page); await page.waitForSelector('#learningPath .td-home');
   let t = await today(page) || await page.evaluate(() => null);
   await page.click('#learningPath .td-start'); t = await today(page);
   assert.equal(t.steps[0].kind, 'review', 'due words: review first'); assert(t.steps.some(s => s.kind === 'lesson'), 'then a new lesson');
   // now an unfinished lesson: start it from the map, leave after one card
   await page.evaluate(() => { localStorage.removeItem('leren_today_v1'); learningPath.model.state.warmed = null; learningPath.model.save() });
   await reload(page); await page.evaluate(() => learningPath.chapter(learningPath.model.recommended().chapter));
   await page.locator('#learningPath .fh-lesson-row[aria-current]').click(); await waitScreen(page, 'intro'); await page.locator('#learningPath .lp-primary').first().click();
   await waitScreen(page, 'lesson'); await page.locator('#learningPath .fl-actions .lp-primary').click();
   const paused = await page.evaluate(() => learningPath.model.state.session); assert.equal(paused.kind, 'lesson');
   await page.click('#learningPath .fl-exit'); await page.evaluate(() => localStorage.removeItem('leren_today_v1')); await reload(page); await page.waitForSelector('#learningPath .td-home');
   const home = await page.evaluate(() => ({start: document.querySelector('#learningPath .td-start').textContent, bubble: document.querySelector('#learningPath .td-bubble')?.textContent || ''}));
   assert.match(home.start, /Продовжити урок/, 'unfinished lesson: «Продовжити урок»'); assert.match(home.bubble, /ще не завершено/, 'Lexi names the unfinished lesson');
   await page.click('#learningPath .td-start'); await waitScreen(page, 'lesson'); t = await today(page);
   assert.equal(t.steps[0].kind, 'lesson', 'unfinished lesson first'); assert(!t.steps.some(s => s.kind === 'review'), 'no review in front of an unfinished lesson');
   const now = await page.evaluate(() => learningPath.model.state.session); assert.deepEqual([now.lesson, now.phase, now.index], [paused.lesson, paused.phase, paused.index], 'same lesson, same place');
   assert.deepEqual(errors, []); report.push('priorities: unfinished lesson (no review before it) > due review > new lesson'); await ctx.close();
  }

  // ---- 3 talk gate: clear availability criterion for conversations
  {
   const {ctx, page, errors} = await open({seed: {...BASE}});
   const r = await page.evaluate(() => { const m = learningPath.model, c = LerenLearningPath.catalog(DATA, LerenCurriculum), comm = c.lessons.filter(l => l.chapter === 'comm'), out = [];
    out.push([learningPath.talkCoverage(comm[0].id), learningPath.talkReady(comm[0].id)]);
    comm.slice(0, 3).forEach(l => m.state.completed[l.id] = l.ids.length);
    out.push([learningPath.talkCoverage(comm[3].id, true), learningPath.talkReady(comm[3].id, true)]); // forecast while planning (release 275)
    out.push([learningPath.talkCoverage(comm[3].id), learningPath.talkReady(comm[3].id)]); // strict: the 4th lesson is not played yet
    m.state.completed[comm[3].id] = comm[3].ids.length; out.push([learningPath.talkCoverage(comm[3].id), learningPath.talkReady(comm[3].id)]);
    m.state.completed[comm[3].id] = 0; out.push([learningPath.talkCoverage(comm[3].id), learningPath.talkReady(comm[3].id)]); // 0/5 does not count (Codex P2-02)
    const samples = LerenLessonConversation.SCENARIOS.comm.map(s => String(s.sample || '').split(/\s+/).filter(Boolean).length);
    return {out, samples} });
   assert.equal(r.out[0][1], false, 'brand-new learner: first conversation not offered (' + r.out[0][0].toFixed(2) + ')');
   assert.equal(r.out[1][1], true, 'after 3 lessons the 4th lesson\'s conversation is ready (' + r.out[1][0].toFixed(2) + ')');
   assert(r.out[1][0] >= 0.7, 'criterion: ≥70 % known words');
   assert.equal(r.out[2][1], false, 'release 275: an unplayed lesson does not count as known (' + r.out[2][0].toFixed(2) + ')');
   assert.equal(r.out[3][1], true, 'after the 4th lesson is passed its conversation is ready (' + r.out[3][0].toFixed(2) + ')');
   assert.equal(r.out[4][1], false, 'the 4th lesson finished with 0 correct is not known (' + r.out[4][0].toFixed(2) + ')');
   assert(Math.max(...r.samples) <= 8, 'A1.1 conversation answers are short phrases (≤ 8 words): ' + r.samples);
   assert.deepEqual(errors, []); report.push(`talk gate: ${Math.round(r.out[0][0] * 100)} % known → no talk; after 3 lessons ${Math.round(r.out[1][0] * 100)} % → talk; A1.1 answers ≤ ${Math.max(...r.samples)} words`); await ctx.close();
  }

  // ---- 4 end of a session: continue / finish for today; reload → Lexi proposes the next step
  {
   const {ctx, page, errors} = await open({seed: EXISTING});
   await page.click('#learningPath .td-start'); await page.waitForFunction(() => learningPath.model.state.session?.kind === 'lesson', null, {timeout: 10000});
   await page.evaluate(() => { const m = learningPath.model, s = m.state.session; s.phase = 2; s.index = s.ids.length - 1; s.answers = s.ids.slice(0, -1).map(() => true); m.save(); learningPath.open() });
   await page.click('#learningPath [data-action=start]'); await page.waitForSelector('#learningPath .lp-options button');
   await page.evaluate(() => { const w = learningPath.model.current(); [...document.querySelectorAll('#learningPath .lp-options button')].find(b => b.textContent === w.nl).click() });
   await page.locator('#learningPath .lp-primary').last().click();
   await page.waitForSelector('#learningPath .td-result');
   const btns = await page.locator('#learningPath .td-result [data-action]').evaluateAll(b => b.map(x => [x.dataset.action, x.textContent.trim()]));
   assert.deepEqual(btns.map(b => b[0]).sort(), ['more', 'stop'], 'two choices at the end');
   assert.match(btns.find(b => b[0] === 'more')[1], /Продовжити навчання/); assert.match(btns.find(b => b[0] === 'stop')[1], /Завершити на сьогодні/);
   await page.click('#learningPath .td-result [data-action=stop]'); await page.waitForSelector('#learningPath .td-home');
   const mode = await page.evaluate(() => document.querySelector('#learningPath .td-home').dataset.mode); assert.equal(mode, 'done', '«Завершити на сьогодні» → the day is done');
   await reload(page); await page.waitForSelector('#learningPath .td-home');
   const h = await page.evaluate(() => ({mode: document.querySelector('#learningPath .td-home').dataset.mode, bubble: document.querySelector('#learningPath .td-bubble')?.textContent || '', start: !!document.querySelector('#learningPath .td-start')}));
   assert.equal(h.mode, 'done'); assert(h.bubble.length > 10, 'Lexi says what is next'); assert(h.start, 'one button for the next step');
   await page.click('#learningPath .td-start'); await page.waitForFunction(() => ['lesson', 'intro', 'talk', 'guided'].includes(document.querySelector('#learningPath')?.dataset.screen), null, {timeout: 10000});
   assert.deepEqual(errors, []); report.push('end: «Продовжити навчання» / «Завершити на сьогодні» → done; after reload Lexi proposes the next step'); await ctx.close();
  }

  // ---- 4b today's only lesson was already finished (app closed before the step was marked): «Продовжити» shows the
  //      summary, never a silent jump back to the home (regression found in the RC run)
  {
   const {ctx, page, errors} = await open({seed: EXISTING});
   await page.evaluate(() => { const d = LerenGuided.day(); localStorage.setItem('leren_today_v1', JSON.stringify({v: 1, date: d, course: 'A1.1', steps: [{id: d + ':0:lesson', kind: 'lesson', min: 6, done: false, lesson: 'comm:phrases:0'}], paid: [], badges: [], round: 1})) });
   await reload(page); await page.waitForSelector('#learningPath .td-home');
   assert.equal(await page.evaluate(() => document.querySelector('#learningPath .td-home').dataset.mode), 'resume');
   await page.click('#learningPath .td-start'); await page.waitForSelector('#learningPath .td-result', {timeout: 8000});
   await page.click('#learningPath .td-result [data-action=more]'); await waitScreen(page, 'lesson');
   assert.notEqual(await page.evaluate(() => learningPath.model.state.session.lesson), 'comm:phrases:0', 'a new lesson, not the finished one');
   assert.deepEqual(errors, []); report.push('finished step on reopen → summary → «Продовжити навчання» → next lesson'); await ctx.close();
  }

  // ---- 4c Android «Back» inside a lesson = ✕: back to Today with the place saved (it used to leave the app); ✕ leaves no extra entry
  {
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: EXISTING});
   await page.waitForSelector('#learningPath .td-home');
   await page.click('#learningPath .td-start'); await waitScreen(page, 'lesson'); await page.locator('#learningPath .fl-actions .lp-primary').click();
   const s0 = await page.evaluate(() => JSON.stringify(learningPath.model.state.session));
   await page.goBack(); await waitScreen(page, 'home');
   const r = await page.evaluate(() => ({url: location.href, focus: document.documentElement.classList.contains('lp-focus'), dock: getComputedStyle(document.getElementById('modeButtons')).display !== 'none', s: JSON.stringify(learningPath.model.state.session)}));
   assert(r.url.startsWith(base) && !r.focus && r.dock, 'Back: still in the app, on Today with the dock'); assert.equal(r.s, s0, 'Back: the place in the lesson is kept');
   await page.click('#learningPath .td-start'); await waitScreen(page, 'lesson'); assert.equal(await page.evaluate(() => JSON.stringify(learningPath.model.state.session)), s0, 'continue → same place');
   // ✕ drops the lesson's history entry: one more Back now leaves the page as before (no dead Back press)
   const len = await page.evaluate(() => history.length); await page.click('#learningPath .fl-exit'); await waitScreen(page, 'home');
   assert.equal(await page.evaluate(() => !!history.state?.fl), false, '✕: no lesson entry left in the history'); assert.equal(await page.evaluate(() => history.length), len);
   assert.deepEqual(errors, []); report.push('Back in a lesson → Today, place kept; ✕ leaves no history entry'); await ctx.close();
  }

  // ---- 4d nothing of the old home is lost: every control of production 264's home has a place in 272
  //      (Today / «Навчання» / «Ще»); the HERO cat greeting was removed on purpose (TEST-050 calm Today)
  {
   const {ctx, page, errors} = await open({seed: EXISTING});
   await page.waitForSelector('#learningPath .td-home');
   const today = await page.evaluate(() => ({start: !!document.querySelector('#learningPath .td-start'), learn: !!document.querySelector('#learningPath [data-action=learn]'), lexi: !!document.querySelector('#learningPath [data-action=lexi]'),
    tiles: [...document.querySelectorAll('#learningPath [data-tile]')].map(e => e.dataset.tile), tabs: [...document.querySelectorAll('#modeButtons [data-tab]')].map(e => e.dataset.tab), settings: !!document.getElementById('settingsBtn')}));
   assert(today.start && today.learn && today.lexi && today.settings, 'Today: continue, choose a lesson, Lexi, settings');
   assert.deepEqual(today.tiles.sort(), ['course', 'goal', 'streak'], 'Today: streak, daily goal, course progress');
   assert.deepEqual(today.tabs, ['today', 'learn', 'lexi', 'games', 'more'], 'dock: games and Lexi one tap away');
   await page.evaluate(() => openLearn()); await page.waitForSelector('.hv-pick-btn');
   const learn = await page.evaluate(() => ({pick: !!document.querySelector('.hv-pick-btn'), free: !!document.querySelector('[data-learn=free]'), tests: !!document.querySelector('[data-learn=tests]'), topics: document.querySelectorAll('.fh-topic').length}));
   assert(learn.pick && learn.free && learn.tests && learn.topics >= 12, '«Навчання»: course/level picker, free practice, tests, all route topics');
   await page.evaluate(() => openToday()); await page.click('[data-tab=more]'); await page.waitForSelector('dialog.td-more');
   const more = await page.$$eval('dialog.td-more [data-more]', b => b.map(x => x.dataset.more));
   for (const id of ['profile', 'dict', 'progress', 'tests', 'life', 'clock', 'free', 'settings', 'guides', 'about']) assert(more.includes(id), '«Ще»: ' + id);
   await page.click('dialog.td-more [data-more=about]'); await page.waitForSelector('dialog.fh-about[open]', {timeout: 5000});
   assert.match(await page.locator('dialog.fh-about h2').textContent(), /lerenbe\.com/, '«Про lerenbe.com» opens');
   await page.keyboard.press('Escape'); await page.click('[data-tab=more]'); await page.waitForSelector('dialog.td-more');
   await Promise.all([page.waitForURL(/\/guides\/$/, {timeout: 10000}), page.click('dialog.td-more [data-more=guides]')]);
   await page.goto(base); await page.waitForFunction(() => window.learningPath); await page.evaluate(() => setView('progress')); await page.waitForTimeout(500);
   assert.match(await page.locator('main').innerText(), /Медаль першого кроку/, '«Мої подарунки» = the gifts in «Прогрес і досягнення»');
   assert.deepEqual(errors, []); report.push('old home 264 → 272: every control has a place (Today/Learn/More); guides + about restored in More; gifts in Progress'); await ctx.close();
  }

  // ---- 5 names: four scripts, shown once, isolated, never synced
  for (const [ui, name] of [['uk', 'Марія'], ['uk', 'محمد'], ['fr', 'Amélie'], ['en', 'John'], ['ar', 'محمد'], ['ar', 'Maria']]) {
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: {...EXISTING, poly_ui: ui, leren_learner_name: JSON.stringify({name, forAI: false})}});
   await page.waitForSelector('#learningPath .td-home'); await page.waitForTimeout(300);
   const m = await page.evaluate(n => { const home = document.querySelector('#learningPath .td-home'), hi = home.querySelector('.td-hi').textContent; return {hi, count: home.innerText.split(n).length - 1, iso: hi.includes('⁨' + n + '⁩'), snap: JSON.stringify(syncSnapshot())} }, name);
   assert(m.hi.includes(name), `${ui}/${name}: greeting by name`); assert.equal(m.count, 1, `${ui}/${name}: the name appears once on Today`);
   assert(m.iso, `${ui}/${name}: the name is direction-isolated`); assert(!m.snap.includes(name), `${ui}/${name}: not in the account snapshot`);
   assert.deepEqual(errors, []); await ctx.close();
  }
  {
   // static: only the app shell (to exclude it from sync) and the guided core read the name; no AI/Lexi/Worker code touches it
   const readers = []; const walk = d => { for (const e of fs.readdirSync(d, {withFileTypes: true})) { if (['node_modules', 'tests', '.git', 'docs', 'audio', 'images', 'guides'].includes(e.name)) continue; const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f); else if (/\.(js|mjs|cjs|ts)$/.test(e.name) && /leren_learner_name/.test(fs.readFileSync(f, 'utf8'))) readers.push(path.relative(root, f)) } };
   walk(root); assert.deepEqual(readers.sort(), ['app.js', 'modules/guided/core.js'], 'name readers: ' + readers);
   const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8'); assert.match(app, /"leren_learner_name","leren_today_v1"\]\);/, 'name excluded from sync/backup');
   for (const d of ['modules/lexi', 'ai']) if (fs.existsSync(path.join(root, d))) for (const f of fs.readdirSync(path.join(root, d)).filter(f => f.endsWith('.js'))) assert.doesNotMatch(fs.readFileSync(path.join(root, d, f), 'utf8'), /LerenGuided\.name|learner_name/, d + '/' + f + ' does not read the name');
   report.push('names uk/fr/en/ar: shown once, isolated, not synced; only app.js + guided core read it');
  }

  // ---- 6 regressions: dock labels at 320 px; «Запитай Lexi» on the focus study card and the check screen
  for (const ui of ['uk', 'fr', 'en', 'ar']) {
   const {ctx, page, errors} = await open({w: 320, h: 640, seed: {...EXISTING, poly_ui: ui}});
   await page.waitForSelector('#learningPath .td-home');
   const clipped = await page.evaluate(() => [...document.querySelectorAll('#modeButtons button')].filter(b => b.offsetParent).filter(b => [b, ...b.querySelectorAll('*')].some(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible')).map(b => b.textContent.trim()));
   assert.deepEqual(clipped, [], ui + ': no clipped dock label at 320 px');
   if (ui === 'uk') {
    await page.click('#learningPath .td-start'); await waitScreen(page, 'lesson');
    await page.waitForSelector('#learningPath .fl-task .lesson-help-row, #learningPath .lesson-help-row', {timeout: 5000});
    assert(await page.locator('#learningPath .lesson-help-row').count() >= 1, '«Запитай Lexi» on the study card');
    await page.evaluate(() => { const m = learningPath.model, s = m.state.session; s.phase = 2; s.index = 0; m.save(); learningPath.open() });
    if (await page.locator('#learningPath [data-action=start]').count()) await page.click('#learningPath [data-action=start]');
    await page.waitForSelector('#learningPath .lp-options'); await page.waitForSelector('#learningPath .lesson-help-row', {timeout: 5000});
   }
   assert.deepEqual(errors, []); await ctx.close();
  }
  report.push('regressions: dock labels uk/fr/en/ar at 320 px not clipped; «Запитай Lexi» on study and check');

  assert.deepEqual(aiCalls, [], 'no AI/Worker request during the RC checks');
  console.log('PASS: TEST-050 RC (emulated Chromium, not a physical phone)'); for (const r of report) console.log(' - ' + r);
 } catch (e) { console.error('FAIL:', e.message); for (const r of report) console.error(' ok: ' + r); if (process.env.V) console.error(e.stack); process.exitCode = 1 } finally { await browser.close(); server.close() }
})();
