// TEST-050 · «Фокус» lesson mode in the browser (Playwright Chromium with emulated phone sizes — NOT a physical Samsung).
// A whole lesson is played with real taps on 320×640, 360×780, 390×844 and 412×915: every task screen (study, listen,
// check, feedback after a right and a wrong answer, end of a step) must show the task and its main action without
// scrolling; header and dock are hidden during the lesson and ✕ leaves with the place saved. Also: first run with
// Dutch / English / French, existing learner (no onboarding, progress kept), the conversation with the Android keyboard
// (viewport shrunk as resizes-content does), landscape, offline (Service Worker), resume, XP once, no LIFE call during
// a lesson, male / female voice labels, uk/en/fr/ar + RTL, dark theme contrast, large system font. No AI requests.
// Run: node tests/test050-focus-browser.cjs (skipped without Playwright). SHOTS=<dir> saves screenshots.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
(async () => {
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: Playwright is not installed'); return }
 const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json'};
 let offline = false;
 const server = http.createServer((req, res) => { if (offline) { req.socket.destroy(); return }
  let f = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end() }
  res.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); res.setHeader('cache-control', 'no-cache'); fs.createReadStream(f).pipe(res) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port + '/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const release = fs.readFileSync(path.join(root, 'app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
 const SHOTS = process.env.SHOTS, shot = async (page, name) => { if (SHOTS) await page.screenshot({path: path.join(SHOTS, 'focus-' + name + '.png')}) };
 const aiCalls = [], report = []; report.push = (...a) => { if (process.env.VERBOSE) console.log('  ok', ...a); return Array.prototype.push.apply(report, a) };
 const BASE = {poly_ui: 'uk', leren_welcome_seen: 'true', leren_tour_done: 'true', leren_level_asked: 'true', leren_start_known_v1: '"zero"', leren_release_seen: JSON.stringify(release)};
 const EXISTING = {...BASE, poly_streak: '4', poly_score: '120', leren_goal_min: '10', leren_rec_voice: '"f"', leren_char: '"dafna"', leren_voice_migrated: 'true',
  leren_path_v1: JSON.stringify({version: 1, started: true, completed: {'comm:phrases:0': 5}}), leren_profile_v1: JSON.stringify({v: 1, goals: ['belgium'], pace: 'balanced', namePrompt: 'later', source: 'existing'})};
 async function open({w = 390, h = 844, seed = null, sw = false, dark = false, session = null} = {}) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, serviceWorkers: sw ? 'allow' : 'block', hasTouch: true, colorScheme: dark ? 'dark' : 'light'}), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/workers\.dev|anthropic|leren-ai/.test(r.url())) aiCalls.push(r.url()) });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.abort());
  if (seed || session) await page.addInitScript(([s, ss]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); for (const [k, v] of Object.entries(s || {})) localStorage.setItem(k, v); for (const [k, v] of Object.entries(ss || {})) sessionStorage.setItem(k, v) }, [seed, session]);
  await page.goto(sw ? base.replace('127.0.0.1', 'localhost') : base); await page.waitForFunction(() => window.learningPath && window.LerenGuided && window.LerenFocusLesson, null, {timeout: 20000});
  return {ctx, page, errors};
 }
 const screen = p => p.evaluate(() => document.querySelector('#learningPath')?.dataset.screen);
 const waitScreen = (p, s) => p.waitForFunction(s => document.querySelector('#learningPath')?.dataset.screen === s, s, {timeout: 10000});
 // What a learner sees: the task area and the main action inside the viewport, no page scroll, no sideways scroll.
 const fit = p => p.evaluate(() => {
  const vh = innerHeight, inView = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= -1 && r.bottom <= vh + 1 };
  const main = [...document.querySelectorAll('#learningPath .fl-actions .lp-primary, #learningPath .lc-form .lp-primary')].pop();
  const opts = [...document.querySelectorAll('#learningPath .lp-options .lp-button')].filter(b => b.offsetParent);
  const dock = document.getElementById('modeButtons'), head = document.querySelector('main>header');
  return {scroll: document.documentElement.scrollHeight - vh, hscroll: document.documentElement.scrollWidth > innerWidth, main: !!main && inView(main), opts: opts.every(inView), nOpts: opts.length,
   focus: document.documentElement.classList.contains('lp-focus'), dockHidden: !dock || getComputedStyle(dock).display === 'none', headHidden: getComputedStyle(head).display === 'none',
   lexi: document.querySelector('#learningPath .fl-lexi .fl-bubble')?.textContent || '', bar: !!document.querySelector('#learningPath .fl-bar .fl-exit')};
 });
 const state = p => p.evaluate(() => { const s = learningPath.model.state.session; return {scr: document.querySelector('#learningPath').dataset.screen, kind: s?.kind, phase: s?.phase, index: s?.index, len: s?.ids?.length, fb: !!document.querySelector('#learningPath .lp-feedback')} });
 const tapMain = p => p.locator('#learningPath .fl-actions .lp-primary').click();
 // Plays the open lesson to its end with taps; returns every screen checked. wrongOnce: one wrong answer in «check».
 async function playLesson(p, {wrongOnce = true, label = '', stopAtCheck = false, strict = true} = {}) {
  const seen = []; let wrongDone = false;
  for (let guard = 0; guard < 60; guard++) {
   const st = await state(p); if (st.scr !== 'lesson') break;
   if (stopAtCheck && st.phase === 2 && !st.fb && st.index < st.len) return seen;
   const tag = st.fb ? 'feedback' : st.index === st.len ? 'stepdone' : ['study', 'listen', 'check'][st.phase];
   const f = await fit(p); seen.push({tag, ...f});
   if (strict) {
   assert(f.focus && f.dockHidden && f.headHidden && f.bar, label + tag + ': focus mode (header and dock hidden, ✕ shown)');
   assert(!f.hscroll, label + tag + ': no sideways scroll');
   assert(f.scroll <= 2, label + tag + ': fits the screen without scrolling (overflow ' + f.scroll + 'px)');
   if (tag === 'listen' || tag === 'check') { assert(f.nOpts === 4 && f.opts, label + tag + ': all four answers visible'); assert(f.lexi, label + tag + ': Lexi explains the task') }
   else assert(f.main, label + tag + ': main action visible');
   }
   if (tag === 'feedback' || tag === 'stepdone' || tag === 'study') { await tapMain(p); continue }
   const right = await p.evaluate(ph => { const w = learningPath.model.current(); return ph === 1 ? (w[document.querySelector('#learningPath').lang] || w.uk) : w.nl }, st.phase);
   const wrong = wrongOnce && st.phase === 2 && !wrongDone; wrongDone = wrongDone || wrong;
   await p.evaluate(([c, wrong]) => { const bs = [...document.querySelectorAll('#learningPath .lp-options .lp-button')]; (wrong ? bs.find(b => b.textContent !== c) : bs.find(b => b.textContent === c)).click() }, [right, wrong]);
   if (wrong) { const f2 = await fit(p); assert(f2.lexi.includes(await p.evaluate(() => learningPath.model.state.session && document.querySelector('#learningPath .fl-answer .lp-word')?.textContent)), label + 'Lexi names the right answer after a mistake'); }
  }
  return seen;
 }
 try {
  // ---- 1 first run: Dutch / English / French decide the course and the first lesson
  for (const course of ['nl', 'en', 'fr']) {
   const {ctx, page, errors} = await open({w: 320, h: 640, seed: {poly_ui: 'uk'}});
   await page.waitForSelector('dialog.td-onb[data-step="1"]', {timeout: 15000});
   assert.deepEqual(await page.$$eval('dialog.td-onb .td-courses [data-value]', b => b.map(x => x.dataset.value)), ['nl', 'en', 'fr'], 'first question: Dutch / English / French');
   assert(await page.evaluate(() => document.querySelector('dialog.td-onb [data-action=next]').getBoundingClientRect().bottom <= innerHeight), 'step 1 button visible on 320×640');
   if (course === 'nl') await shot(page, 'onboarding-320');
   await page.click(`dialog.td-onb .td-courses [data-value="${course}"]`); await page.click('dialog.td-onb [data-action=next]');
   await page.fill('#tdOnbName', 'Марія'); await page.click('dialog.td-onb [data-action=next]');
   await page.click('dialog.td-onb [data-value=work]'); await page.click('dialog.td-onb [data-action=next]');
   await page.click('dialog.td-onb [data-value=zero]'); await page.click('dialog.td-onb [data-action=next]');
   await page.click('dialog.td-onb [data-value="10"]'); await page.click('dialog.td-onb [data-action=finish]');
   if (course === 'nl') {
    await waitScreen(page, 'lesson'); assert.equal(await page.evaluate(() => localStorage.getItem('leren_learn_lang')), 'nl');
    assert.equal(await page.evaluate(() => document.querySelector('.cp-stage')), null, 'no English/French player for Dutch');
   } else {
    await page.waitForSelector(`.cp-stage[data-lang="${course}"][data-phase="study"]`, {timeout: 10000});
    assert.equal(await page.evaluate(() => localStorage.getItem('leren_learn_lang')), course, course + ': course saved');
    assert.equal(await page.evaluate(() => localStorage.getItem('leren_path_v1')), null, course + ': the Dutch route is not started');
    assert(await page.evaluate(c => !!localStorage.getItem('leren_path_v1@' + c), course), course + ': its own progress key');
    const main = await page.evaluate(() => { const b = document.querySelector('.cp-stage .cp-main'); const r = b.getBoundingClientRect(); return getComputedStyle(b).position === 'fixed' && r.bottom <= innerHeight });
    assert(main, course + ': main action fixed at the bottom of the lesson'); await shot(page, 'first-run-' + course);
    await page.click('.cp-stage .cp-close'); await page.waitForSelector('.td-start');
    assert(/Hello|Bonjour/.test(await page.textContent('.td-home')), course + ': Today shows that course, not Dutch');
    await page.click('.td-start'); await page.waitForSelector(`.cp-stage[data-lang="${course}"][data-phase]`); // «Почати навчання» → back into the same lesson
   }
   assert.deepEqual(errors, []); await ctx.close();
  }
  report.push('first run: NL → Dutch lesson; EN/FR → their first lesson, Dutch route untouched, Today follows the course');

  // ---- 2 existing learner: no onboarding, progress kept; the whole lesson fits on four phone sizes
  for (const [w, h] of [[320, 640], [360, 780], [390, 844], [412, 915]]) {
   const {ctx, page, errors} = await open({w, h, seed: EXISTING});
   await page.waitForTimeout(900); assert.equal(await page.$('dialog.td-onb'), null, 'existing learner: no onboarding');
   assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('leren_path_v1'))).completed['comm:phrases:0'], 5, 'progress kept');
   await page.click('.td-start'); await waitScreen(page, 'lesson');
   const seen = await playLesson(page, {label: w + '×' + h + ' '});
   assert(['study', 'listen', 'check', 'feedback', 'stepdone'].every(t => seen.some(s => s.tag === t)), 'all lesson screens checked');
   if (w === 320) await shot(page, 'after-lesson-320');
   assert.deepEqual(errors, []); report.push(w + '×' + h + ': ' + seen.length + ' lesson screens, each without scrolling'); await ctx.close();
  }

  // ---- 3 ✕ keeps the place; resume after reload; XP for a lesson once; no LIFE call during the lesson
  {
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: EXISTING, session: {'leren-mid-lesson-call-v1': JSON.stringify({elapsed: 9e6, target: 1, shown: false})}});
   await page.click('.td-start'); await waitScreen(page, 'lesson');
   for (let i = 0; i < 2; i++) await tapMain(page); // two study cards
   const before = await state(page);
   await page.click('#learningPath .fl-exit'); await waitScreen(page, 'home');
   assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('modeButtons')).display !== 'none'), true, '✕: back home with the dock');
   await page.reload(); await page.waitForFunction(() => window.learningPath);
   await page.click('.td-start'); await waitScreen(page, 'lesson');
   const after = await state(page); assert.deepEqual([after.phase, after.index], [before.phase, before.index], 'same place after ✕ and reload');
   const xp0 = await page.evaluate(() => score); await playLesson(page, {wrongOnce: false});
   const xp1 = await page.evaluate(() => score); assert(xp1 > xp0, 'lesson XP saved');
   assert.equal(await page.$('#midLessonCall'), null, 'no LIFE call interrupted the lesson (timer already past its target)');
   await page.reload(); await page.waitForFunction(() => window.learningPath); assert.equal(await page.evaluate(() => score), xp1, 'XP unchanged after reload');
   const t = JSON.parse(await page.evaluate(() => localStorage.getItem('leren_today_v1'))); assert.equal(t.paid.length, new Set(t.paid).size, 'each step paid once');
   assert.deepEqual(errors, []); report.push('✕ saves the place, resume after reload, XP ' + (xp1 - xp0) + ' once, no LIFE call during the lesson'); await ctx.close();
  }

  // ---- 4 conversation + Android keyboard (resizes-content: the layout viewport shrinks) and Lexi instead of Peter/Dafna
  {
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: EXISTING});
   // talk gate: practice is planned only when the learner knows ≥70 % of the conversation's words → 3 lessons of «comm» done first
   await page.evaluate(() => { const m = learningPath.model, c = LerenLearningPath.catalog(DATA, LerenCurriculum); for (const l of c.lessons.filter(l => l.chapter === 'comm').slice(0, 3)) m.state.completed[l.id] = l.ids.length; m.save(); localStorage.removeItem('leren_today_v1') });
   await page.reload(); await page.waitForFunction(() => window.learningPath && window.LerenFocusLesson);
   await page.click('.td-start'); await waitScreen(page, 'lesson'); await playLesson(page, {wrongOnce: false});
   await page.waitForSelector('#learningPath [data-action=next]'); await page.click('#learningPath [data-action=next]'); await waitScreen(page, 'talk');
   const text = await page.evaluate(() => document.querySelector('#learningPath').innerText);
   assert(!/Peter|Пітер|Dafna|Дафн/.test(text), 'the conversation names no Peter/Dafna'); assert((await fit(page)).lexi, 'Lexi introduces the conversation');
   assert((await fit(page)).main, 'talk: «check» visible without scrolling');
   await page.focus('#learningPath textarea'); await page.setViewportSize({width: 360, height: 450}); await page.waitForTimeout(500);
   const k = await page.evaluate(() => { const r = e => e.getBoundingClientRect(), ta = document.querySelector('#learningPath textarea'), b = document.querySelector('#learningPath .lc-form .lp-primary'); return {typing: document.documentElement.classList.contains('fl-typing'), field: r(ta).top >= 0 && r(ta).bottom <= innerHeight, button: r(b).top >= 0 && r(b).bottom <= innerHeight} });
   assert.deepEqual(k, {typing: true, field: true, button: true}, 'keyboard open: the field and «check» stay visible');
   await shot(page, 'keyboard-360'); assert.deepEqual(errors, []); report.push('conversation: Lexi, no Peter/Dafna; keyboard open → field and button visible'); await ctx.close();
  }

  // ---- 5 landscape (phone turned): the check screen still shows the four answers and the main action
  {
   const {ctx, page, errors} = await open({w: 844, h: 390, seed: EXISTING});
   await page.click('.td-start'); await waitScreen(page, 'lesson');
   await playLesson(page, {wrongOnce: false, stopAtCheck: true, strict: false}); await page.waitForSelector('#learningPath .lp-options .lp-button');
   const f = await fit(page); assert(!f.hscroll && f.opts && f.nOpts === 4, 'landscape: four answers visible, no sideways scroll'); await shot(page, 'landscape');
   assert.deepEqual(errors, []); report.push('landscape 844×390: answers visible (overflow ' + f.scroll + 'px)'); await ctx.close();
  }

  // ---- 6 voices: «Чоловічий / Жіночий голос», the old female choice kept
  {
   const {ctx, page, errors} = await open({w: 390, h: 844, seed: EXISTING});
   const labels = await page.evaluate(() => { const u = UI.uk; return [u.voiceRecorded, u.voiceRecordedF] });
   assert(/Чоловічий голос/.test(labels[0]) && /Жіночий голос/.test(labels[1]), 'voice labels: male / female');
   assert.equal(await page.evaluate(() => localStorage.getItem('leren_rec_voice')), '"f"', 'the old female choice (Dafna) stays female');
   await page.waitForFunction(() => audioSets.f.size > 0, null, {timeout: 15000}); const row = await page.evaluate(() => { renderShellText(); return document.getElementById('voiceRowValue')?.textContent || '' }); assert(!/Peter|Dafna|Пітер|Дафн/.test(row), 'voice row names no character: ' + row);
   if (row) assert(/Жіночий/.test(row), 'voice row shows the female voice: ' + row);
   for (const l of ['en', 'fr', 'ar']) { const v = await page.evaluate(l => [UI[l].voiceRecorded, UI[l].voiceRecordedF].join(' '), l); assert(!/Peter|Dafna|بيتر|دافنا/.test(v), l + ': no character names in voice labels') }
   assert.deepEqual(errors, []); report.push('voices: male / female labels in 4 languages, old choice kept'); await ctx.close();
  }

  // ---- 7 interface languages, RTL, dark theme contrast, large system font
  for (const ui of ['uk', 'en', 'fr', 'ar']) {
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: {...EXISTING, poly_ui: ui}, dark: ui === 'en'});
   await page.click('.td-start'); await waitScreen(page, 'lesson');
   const f = await fit(page); assert(f.main && !f.hscroll && f.scroll <= 2 && f.lexi, ui + ': study screen fits');
   assert.equal(await page.evaluate(() => document.querySelector('#learningPath .fl-bar').dir), ui === 'ar' ? 'rtl' : 'ltr', ui + ': direction');
   if (ui === 'ar') await shot(page, 'ar-360');
   assert.deepEqual(errors, []); await ctx.close();
  }
  {
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: {...EXISTING, poly_theme: 'dark'}, dark: true});
   await page.click('.td-start'); await waitScreen(page, 'lesson');
   await playLesson(page, {wrongOnce: false, stopAtCheck: true, strict: false}); await page.waitForSelector('#learningPath .lp-options .lp-button');
   const c = await page.evaluate(() => {
    const rgb = s => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number), L = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }); return .2126 * r + .7152 * g + .0722 * b }, cr = (a, b) => { const x = L(rgb(a)), y = L(rgb(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };
    const opt = document.querySelector('#learningPath .lp-options .lp-button'), bg = getComputedStyle(document.body).backgroundColor, os = getComputedStyle(opt);
    const lexi = getComputedStyle(document.querySelector('#learningPath .fl-bubble'));
    return {dark: document.documentElement.dataset.theme, text: cr(os.color, os.backgroundColor), border: cr(os.borderTopColor, os.backgroundColor), lexi: cr(lexi.color, lexi.backgroundColor), page: bg};
   });
   assert.equal(c.dark, 'dark'); assert(c.text >= 4.5 && c.lexi >= 4.5, 'dark theme: text ≥ 4.5:1 (' + c.text.toFixed(1) + ', ' + c.lexi.toFixed(1) + ')'); assert(c.border >= 3, 'dark theme: answer outline ≥ 3:1 (' + c.border.toFixed(2) + ')');
   await shot(page, 'dark-check-360'); assert.deepEqual(errors, []); report.push('dark theme: text ' + c.text.toFixed(1) + ':1, outline ' + c.border.toFixed(1) + ':1'); await ctx.close();
  }
  {
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: EXISTING});
   await page.addStyleTag({content: 'html{font-size:125%!important}'}); // Samsung «Розмір шрифту» → bigger text in Chrome
   await page.click('.td-start'); await waitScreen(page, 'lesson');
   const f = await fit(page); assert(f.main && !f.hscroll, 'large font: main action visible, no sideways scroll');
   await shot(page, 'large-font-360'); assert.deepEqual(errors, []); report.push('large font 125%: main action visible, overflow ' + f.scroll + 'px'); await ctx.close();
  }

  // ---- 8 offline: the focus mode, Lexi and a lesson from the Service Worker cache
  {
   const {ctx, page, errors} = await open({w: 360, h: 780, seed: EXISTING, sw: true});
   await page.waitForFunction(async () => { const ks = await caches.keys(); if (!ks.length) return false; const c = await caches.open(ks[0]); return !!(await c.match('./modules/focus-lesson/style.css?v=1')) && !!(await c.match('./modules/focus-lesson/ui.js?v=2')) }, null, {timeout: 60000});
   await page.reload(); await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, {timeout: 20000});
   offline = true; await ctx.setOffline(true); await page.reload(); await page.waitForFunction(() => window.learningPath && window.LerenFocusLesson, null, {timeout: 20000});
   await page.click('.td-start'); await waitScreen(page, 'lesson');
   const pos = await page.evaluate(() => getComputedStyle(document.querySelector('#learningPath .fl-actions')).position);
   assert.equal(pos, 'fixed', 'offline: focus styles from the cache'); assert((await fit(page)).lexi, 'offline: Lexi line (local text)');
   offline = false; assert.deepEqual(errors.filter(e => !/Failed to fetch|NetworkError|net::/.test(e)), []); report.push('offline: focus mode, Lexi and the lesson from the cache'); await ctx.close();
  }
  assert.deepEqual(aiCalls, [], 'no AI requests');
  console.log('PASS: TEST-050 focus lesson\n - ' + report.join('\n - '));
 } finally { await browser.close(); server.close() }
})().catch(e => { console.error('FAIL:', e.message); process.exit(1) });
