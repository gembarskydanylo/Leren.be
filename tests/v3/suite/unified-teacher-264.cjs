// LerenBe 3.0 · release 264 · Lexi is the only AI teacher.
// 1. Settings has no Peter / Dafna teacher switch, in uk / en / fr / ar, phone (360) and desktop (1440): no empty rows,
//    nothing past the edge, the voice row is still there (Peter and Dafna stay as recorded voices).
// 2. Old settings keep working: the old teacher choice becomes the voice once (dafna or the older lotte → Dafna's voice,
//    peter → Peter's voice), a voice the learner already picked is kept, and a later voice change is never undone.
// 3. Changing the voice does not touch the story character, and the story «Een dag in België» opens without a
//    teacher picker (also for learners who never picked one); the guide is still a story character.
// 4. The exam AI block and the onboarding name Lexi, never Peter / بيتر, as the AI teacher; Lexi asks the Worker as Lexi.
const assert = require('node:assert/strict');
let browser; try { ({browser} = require('../tools/test-043/serve.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const fs = require('node:fs'), path = require('node:path'), {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
const OLD_TEACHER = /Обери вчителя|Choose your teacher|Choisis ton professeur|اختر معلّمك/;
(async () => {
 let B; try { B = await browser() } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 await B.b.close(); const {chromium} = require('playwright'), br = await chromium.launch(); const bad = [];
 const base = ui => ({leren_release_seen: JSON.stringify(rel), poly_ui: ui, poly_target: 'nl', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_ai_consent18: 'true', leren_tour_done: 'true', leren_level_asked: 'true', leren_ai_endpoint: JSON.stringify(B.base + '/mock-ai/')});
 const open = async (ui, extra, viewport = {width: 1440, height: 900}) => {
  const ctx = await br.newContext({viewport, serviceWorkers: 'block'}); const sent = [];
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.includes('/mock-ai/')) { try { sent.push(JSON.parse(r.request().postData() || '{}')) } catch (e) {} return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({reply: 'Goed zo! Waar woon je?', reply_nl: 'Goed zo! Waar woon je?', translation: '—', correction: null, answer: '—', examples: []})}) } return u.startsWith(B.base) ? r.continue() : r.abort() });
  const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); for (const [k, v] of Object.entries(s)) if (v != null) localStorage.setItem(k, v) }, {...base(ui), ...extra});
  await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => typeof setView === 'function' && typeof storyMap === 'function', null, {timeout: 20000}); await page.waitForTimeout(300);
  return {ctx, page, errors, sent};
 };
 const ls = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
 try {
  // 1 · Settings, 4 languages × phone / desktop
  for (const ui of ['uk', 'en', 'fr', 'ar']) for (const vp of [{width: 360, height: 760}, {width: 1440, height: 900}]) {
   const tag = ui + ' ' + vp.width + ': ', {ctx, page, errors} = await open(ui, {leren_char: '"dafna"'}, vp);
   await page.click('#settingsBtn'); await page.waitForTimeout(500);
   const s = await page.evaluate(() => { const sh = document.getElementById('settingsSheet'), W = document.documentElement.clientWidth;
    const rows = [...sh.querySelectorAll('.set-row')].filter(r => r.offsetParent !== null);
    return {charRow: !!document.getElementById('charRow'), chMini: sh.querySelectorAll('.ch-mini, .ch-seg').length, text: sh.innerText,
     voice: !!document.getElementById('voiceRow') && document.getElementById('voiceRow').offsetParent !== null, voiceValue: document.getElementById('voiceRowValue')?.textContent || '',
     empty: rows.filter(r => !r.innerText.trim() && !r.querySelector('select,button,input')).length,
     over: rows.filter(r => { const b = r.getBoundingClientRect(); return b.width && (b.left < -1 || b.right > W + 1) }).length, scroll: document.documentElement.scrollWidth - W} });
   if (s.charRow || s.chMini) bad.push(tag + 'the teacher switch is still in Settings');
   if (/\b(Peter|Dafna)\b/.test(s.text.replace(s.voiceValue, ''))) bad.push(tag + 'Settings still names Peter / Dafna outside the voice row');
   if (!s.voice) bad.push(tag + 'no voice row'); if (s.empty) bad.push(tag + s.empty + ' empty row(s)'); if (s.over) bad.push(tag + s.over + ' row(s) past the edge');
   if (s.scroll > 1) bad.push(tag + 'page scrolls sideways by ' + s.scroll + ' px');
   if (errors.length) bad.push(tag + 'page errors ' + errors.join(' / ').slice(0, 160));
   await ctx.close();
  }
  // 2 · migration of old values
  const cases = [
   ['old dafna, no voice', {leren_char: '"dafna"'}, 'f'], ['older lotte', {leren_char: '"lotte"'}, 'f'], ['old peter', {leren_char: '"peter"'}, 'm'],
   ['no choice at all', {}, 'm'], ['dafna + Peter voice picked', {leren_char: '"dafna"', leren_rec_voice: '"m"'}, 'm'], ['peter + Dafna voice picked', {leren_char: '"peter"', leren_rec_voice: '"f"'}, 'f'],
   ['Lexi tests value', {leren_char: '"lexi"'}, 'm']];
  for (const [name, extra, want] of cases) {
   const {ctx, page, errors} = await open('uk', extra);
   const r = await page.evaluate(() => ({voice: recVoice(), saved: JSON.parse(localStorage.getItem('leren_rec_voice')), flag: JSON.parse(localStorage.getItem('leren_voice_migrated'))}));
   if (r.voice !== want) bad.push('migration «' + name + '»: voice ' + r.voice + ', want ' + want);
   if (r.flag !== true) bad.push('migration «' + name + '»: not marked as done');
   if (name === 'old dafna, no voice') {
    // the learner then picks Peter's voice: a reload must not bring Dafna's voice back, and the story character stays
    await page.evaluate(() => localStorage.setItem('leren_rec_voice', JSON.stringify('m'))); await page.reload(); await page.waitForFunction(() => typeof recVoice === 'function');
    if (await page.evaluate(() => recVoice()) !== 'm') bad.push('migration ran again and undid the learner\'s voice choice');
    if (await ls(page, 'leren_char') !== 'dafna') bad.push('the story character changed with the voice');
   }
   if (name === 'older lotte' && await ls(page, 'leren_char') === 'lotte' && await page.evaluate(() => charId()) !== 'dafna') bad.push('lotte is no longer read as dafna');
   if (errors.length) bad.push('migration «' + name + '»: page errors ' + errors.join(' / ').slice(0, 160));
   await ctx.close();
  }
  // 3 · story without a picker, voice change keeps the story character; 4 · exam AI block and Lexi request
  for (const ui of ['uk', 'en', 'fr', 'ar']) {
   const {ctx, page, errors, sent} = await open(ui, {});
   await page.evaluate(() => { setView('games'); storyMap() }); await page.waitForTimeout(500);
   const st = await page.evaluate(() => ({popup: [...document.querySelectorAll('.goal-panel, .ch-panel, [role=dialog]')].filter(e => e.offsetParent !== null).map(e => e.innerText).join(' | '), map: document.querySelectorAll('.st-map .st-place').length, guide: !!document.querySelector('.st-head .st-av img'), char: JSON.parse(localStorage.getItem('leren_char'))}));
   if (OLD_TEACHER.test(st.popup)) bad.push(ui + ': the story still asks to choose a teacher');
   if (!st.map) bad.push(ui + ': the story map did not open'); if (!st.guide) bad.push(ui + ': the story guide (character) is missing');
   if (st.char !== null) bad.push(ui + ': opening the story wrote a teacher choice (' + st.char + ')');
   const exam = await page.evaluate(() => { if (!window.EXAM11) return null; switchCourse && switchCourse('a11'); EXAM11.open(); const ai = [...document.querySelectorAll('.ex-aih, .ex-aih ~ .ex-sub, .ex-ai')].map(e => e.innerText).join(' | '); return ai });
   if (exam === null) bad.push(ui + ': no exam module');
   else if (!exam) bad.push(ui + ': the exam AI block is not shown');
   else { if (/Peter|بيتر/.test(exam)) bad.push(ui + ': the exam AI block names Peter: ' + exam.slice(0, 120)); if (!/Lexi/.test(exam)) bad.push(ui + ': the exam AI block does not name Lexi'); }
   await page.evaluate(() => lexiOpen('free', {})); await page.waitForFunction(() => document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'), null, {timeout: 15000});
   await page.fill('.lexi-host >> #draft', 'Ik woon in Gent.'); await page.click('.lexi-host >> button.send');
   await page.waitForFunction(() => document.querySelector('.lexi-host').shadowRoot.querySelector('.g-bub.them'), null, {timeout: 15000});
   const chats = sent.filter(b => b.mode === 'chat'); if (!chats.length || chats.some(b => b.char !== 'lexi')) bad.push(ui + ': Lexi did not ask the Worker as Lexi (' + chats.map(b => b.char).join() + ')');
   if (errors.length) bad.push(ui + ': page errors ' + errors.join(' / ').slice(0, 160));
   await ctx.close();
  }
  // onboarding: after the level question the tour ends, with no teacher picker
  { const {ctx, page, errors} = await open('uk', {leren_tour_done: null, leren_level_asked: null});
   const shown = await page.evaluate(async () => { await new Promise(r => setTimeout(r, 400)); if (!document.querySelector('.goal-panel .goal-opt')) { firstRun(); await new Promise(r => setTimeout(r, 300)) } const b = document.querySelector('.goal-panel .goal-opt'); if (!b) return 'no level question'; b.click(); await new Promise(r => setTimeout(r, 900)); return [...document.querySelectorAll('.goal-panel')].map(e => e.innerText).join(' | ') });
   if (shown !== 'skip' && OLD_TEACHER.test(shown)) bad.push('onboarding still shows the teacher picker');
   if (shown === 'no level question') bad.push('onboarding: no level question');
   if (shown !== 'skip' && await ls(page, 'leren_tour_done') !== true) bad.push('onboarding: the tour did not finish after the level question');
   if (errors.length) bad.push('onboarding: page errors ' + errors.join(' / ').slice(0, 160));
   await ctx.close(); }
 } finally { await br.close(); B.close?.() }
 if (bad.length) { console.log(bad.join('\n')); assert.fail(bad.length + ' problem(s)') }
 console.log('PASS: Lexi is the only AI teacher — no teacher switch in Settings (uk/en/fr/ar × 360/1440, no empty rows); old Peter/Dafna/lotte values become the voice once and later choices are kept; story without a picker, character unchanged; exam AI block names Lexi (also Arabic); chat request as Lexi; onboarding without a picker');
})().catch(e => { console.error(e); process.exit(1) });
