// LerenBe 3.0 integration (new, PR #63) · Lexi end to end: the real app in Chromium (emulated phone) → the PROPOSED Worker
// (tools/ai-worker.js in the v3 layout = docs/integration-3.0/ai-worker.lexi-proposed.js, run in this process) → a mocked
// model. No real model, no network, nothing deployed. Ten scenarios: free talk, a correction, help with an exercise,
// «explain simply» (interface = studied language), switching the interface language, resuming a closed conversation,
// losing the connection, reopening Lexi, a very long message, broken Worker answers. Lexi must keep the exercise context.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const repo = path.join(__dirname, '..');
const T = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.m4a': 'audio/mp4', '.woff2': 'font/woff2', '.tsv': 'text/plain'};
(async () => {
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: Playwright is not installed'); return }
 const src = fs.readFileSync(path.join(repo, 'tools/ai-worker.js'), 'utf8');
 const W = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default;
 const lim = {async limit() { return {success: true} }}, kvm = new Map();
 const env = {PROVIDER: 'anthropic', ANTHROPIC_KEY: 'sk-test', RATE: {async get(k) { return kvm.get(k) ?? null }, async put(k, v) { kvm.set(k, v) }}, PER_IP: lim, IP_CEIL: lim, ALL: lim, DAILY_LIMIT: '1000', DAILY_IP_LIMIT: '5000'};
 // the mocked model: answers in the shape the Worker asks for; `model` picks a broken answer for a scenario
 let model = 'ok', raw = null; const calls = []; // calls: {app: request body from the app, system: prompt the Worker built, messages}
 const realLog = console.log; console.log = (...a) => { if (!/^AI_USAGE|^anthropic /.test(String(a[0]))) realLog(...a) };
 globalThis.fetch = async (url, opt) => {
  const b = JSON.parse(opt.body); calls.at(-1).system = b.system.map(x => x.text).join(''); calls.at(-1).messages = b.messages;
  if (model === '500') return {ok: false, status: 500, json: async () => ({error: {type: 'api_error'}})};
  if (model === 'text') return {ok: true, status: 200, json: async () => ({stop_reason: 'end_turn', content: [{type: 'text', text: 'Sorry, geen JSON'}]})};
  const ask = JSON.stringify(b.output_config.format.schema).includes('"answer"'), last = b.messages.at(-1).content;
  const out = ask ? {answer: 'Uitleg: ' + last.slice(0, 40), examples: []}
   : /wonen/.test(last) ? {learner_in_target: last, reply: 'Waar woon je precies?', translation: 'Де саме ти живеш?', correction: {has_error: true, severity: 'major', original: 'Ik wonen in Gent.', corrected: 'Ik woon in Gent.', explanation: 'ik + stam: ik woon'}}
   : {learner_in_target: last, reply: 'Leuk! Vertel meer.', translation: 'Чудово! Розкажи більше.', correction: {has_error: false, severity: 'minor', original: '', corrected: '', explanation: ''}};
  return {ok: true, status: 200, json: async () => ({stop_reason: 'end_turn', usage: {}, content: [{type: 'text', text: JSON.stringify(out)}]})};
 };
 const server = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/ai/') { let body = ''; q.on('data', c => body += c); q.on('end', async () => {
   if (q.method === 'OPTIONS') { r.statusCode = 204; r.setHeader('access-control-allow-origin', '*'); r.setHeader('access-control-allow-headers', '*'); return r.end() }
   calls.push({app: JSON.parse(body)});
   if (raw) { r.statusCode = raw.status; r.setHeader('content-type', raw.type || 'text/html'); return r.end(raw.body) }
   const res = await W.fetch(new Request('https://leren-ai.example/', {method: 'POST', headers: {Origin: 'https://lerenbe.com', 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.5', 'X-Leren-Device': q.headers['x-leren-device'] || ''}, body}), env, {waitUntil() {}});
   r.statusCode = res.status; r.setHeader('content-type', 'application/json'); r.setHeader('access-control-allow-origin', '*'); r.end(await res.text()) }); return }
  let f = path.join(repo, decodeURIComponent(u.pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(repo) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() }
  r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://localhost:' + server.address().port, AI = base + '/ai/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
 const S = '.lexi-host >> ';
 const open = async (ui, extra = {}, q = '') => {
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true, serviceWorkers: 'block'}), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await page.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) },
   {leren_release_seen: JSON.stringify(rel), poly_ui: ui, poly_target: 'nl', leren_home_v1: 'path', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero',
    leren_ai_consent18: 'true', leren_char: '"peter"', leren_tour_done: 'true', leren_ai_endpoint: JSON.stringify(AI), ...extra});
  await page.goto(base + '/app/index.html' + q); await page.waitForFunction(() => !!window.LerenLexi && typeof lexiOpen === 'function', null, {timeout: 20000});
  return {ctx, page, errors};
 };
 const send = async (page, text, expectRequest = true) => {
  const n0 = calls.length; await page.fill(S + '#draft', text); await page.click(S + 'button.send');
  for (let i = 0; i < 100; i++) { await page.waitForTimeout(50); if ((!expectRequest || calls.length > n0) && !(await page.locator(S + '.lexi-thinking').count())) break }
  await page.waitForTimeout(250); return conv(n0);
 };
 // the last conversation request (Lexi also sends a «memo» request to update its notes after some turns)
 const conv = (from = 0) => calls.slice(from).filter(c => c.app.mode !== 'memo').at(-1) || null;
 const text = page => page.locator('.lexi-host').evaluate(h => h.shadowRoot.textContent);
 const quiz = async page => { await page.evaluate(() => { lessonMode = 'quiz'; mode = 'quiz'; setView('lesson'); buildNav(); newRound() }); await page.waitForSelector('#card .lesson-help');
  return page.evaluate(() => document.querySelector('#card .q, #card h2, #card .question')?.textContent?.trim() || '') };
 const pass = m => realLog('PASS ' + m);
 try {
  // 1 free talk + 2 a correction
  { const {ctx, page, errors} = await open('uk'); await page.evaluate(() => lexiOpen('free', {})); await page.waitForSelector(S + '#draft');
   let c = await send(page, 'Ik heb een kat.'); assert.ok(c, 'a request'); assert.equal(c.app.char, 'lexi', 'the app asks for Lexi'); assert.match(c.system, /You are Lexi/); assert.doesNotMatch(c.system, /Peter|Dafna/);
   assert.match(await text(page), /Leuk! Vertel meer\./, 'reply shown'); assert.equal(await page.locator(S + '.ai-fix, .light-fix').count(), 0, 'no correction when has_error is false');
   c = await send(page, 'Ik wonen in Gent.'); assert.match(await text(page), /Ik woon in Gent\./, 'the corrected sentence is shown'); assert.ok(await page.locator(S + '.ai-fix, .light-fix').count() >= 1, 'a correction is shown');
   assert.equal(c.messages.filter(m => m.role === 'user').length, 2, 'the conversation so far reaches the model');
   assert.deepEqual(errors, []); await ctx.close(); }
  pass('1 free talk: Lexi persona end to end (no Peter / Dafna), reply shown, no card for has_error false · 2 correction card with the corrected sentence; history sent');

  // 3 help with an exercise, 6 resume after closing, 8 reopen: the exercise stays in every request
  { const {ctx, page, errors} = await open('uk'); await quiz(page);
   await page.click('#card .lesson-help'); await page.waitForSelector(S + '#draft');
   let c = await send(page, 'Waarom is dit zo?'); assert.equal(c.app.mode, 'ask'); const q = c.app.profile.question; assert.ok(q, 'the exercise is in the request');
   assert.ok(c.system.includes('the exercise the learner is working on: «' + q.replace(/[\r\n{}<>]/g, ' ').slice(0, 200).trim()), 'the Worker puts the exercise in the prompt');
   assert.match(c.system, /Explain in Ukrainian|in Ukrainian/, 'explained in the interface language');
   c = await send(page, 'En het meervoud?'); assert.equal(c.app.profile.question, q, 'second question: the exercise is still there');
   await page.evaluate(() => lexiClose()); await page.waitForTimeout(200); assert.equal(await page.locator('.lexi-host').count(), 0, 'closed');
   await page.click('#card .lesson-help'); await page.waitForSelector(S + '#draft');
   assert.match(await text(page), /Uitleg: En het meervoud\?/, 'the earlier conversation is back after reopening');
   c = await send(page, 'Nog een voorbeeld?'); assert.equal(c.app.profile.question, q, 'after reopening: the same exercise');
   assert.ok(c.messages.filter(m => m.role === 'user').length >= 3, 'after reopening: the earlier questions are sent with it');
   for (let i = 0; i < 5; i++) { await page.evaluate(() => lexiClose()); await page.click('#card .lesson-help'); await page.waitForSelector(S + '#draft') }
   c = await send(page, 'Dank je!'); assert.equal(c.app.profile.question, q, 'after 5 more reopenings: the same exercise'); assert.equal(await page.locator('.lexi-host').count(), 1, 'one Lexi only');
   assert.deepEqual(errors, []); await ctx.close(); }
  pass('3 exercise help: the exercise reaches the Worker prompt, explained in Ukrainian · 6 resume: closed and reopened, the conversation and the exercise come back · 8 five more reopenings: one Lexi, same exercise');

  // 4 «explain simply»: the production rule (226) keeps the interface language different from the studied one, so a French
  // course with a French interface switches the interface to Ukrainian: the learner never gets "same language". The reply
  // help the learner does get is the «Translate» button of the A1.1 mock exam; the Worker's same-language branch (very
  // simple French) is checked with a direct request, as a future «explain in» choice would send it.
  { const {ctx, page, errors} = await open('fr', {poly_target: 'fr'}, '?multilang=1');
   assert.deepEqual(await page.evaluate(() => [uiLang, targetLang]), ['uk', 'fr'], 'French course: the interface is not French');
   await page.evaluate(() => lexiOpen('grammar', {})); await page.waitForSelector(S + '#draft');
   const c = await send(page, 'Pourquoi « je suis » ?'); assert.equal(c.app.target, 'fr'); assert.equal(c.app.lang, 'uk'); assert.doesNotMatch(c.system, /SAME LANGUAGE/);
   assert.deepEqual(errors, []); await ctx.close(); }
  { const {ctx, page, errors} = await open('uk');
   await page.evaluate(() => { setView('games'); aiStart({id: 'exam11', fresh: true}, 'teacher') }); await page.waitForSelector('#card .ai-tr', {timeout: 20000});
   const tr = page.locator('#card .ai-tr').first(); assert.match((await tr.textContent()).trim(), /Перекласти українською$/, 'the exam reply offers a translation into Ukrainian');
   const n0 = calls.length; await tr.click(); await page.waitForTimeout(300);
   assert.equal(calls.length, n0, 'the Worker sent the translation with the reply: no second request');
   assert.match(await page.locator('#card').textContent(), /Чудово! Розкажи більше\./, 'the Ukrainian translation is shown under the reply');
   assert.match((await tr.textContent()).trim(), /Сховати|Приховати|Hide/, 'the button now hides it');
   assert.deepEqual(errors, []); await ctx.close(); }
  { calls.push({app: {mode: 'ask', direct: true}}); const r = await W.fetch(new Request('https://leren-ai.example/', {method: 'POST', headers: {Origin: 'https://lerenbe.com', 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.6'},
    body: JSON.stringify({mode: 'ask', target: 'fr', lang: 'fr', level: 'a11', char: 'lexi', messages: [{role: 'user', content: 'Pourquoi « je suis » ?'}]})}), env, {waitUntil() {}});
   assert.equal(r.status, 200); assert.match(calls.at(-1).system, /SAME LANGUAGE: the learner's interface language is the studied language \(French\)\. Explain in VERY simple French/, 'Worker: very simple French'); }
  pass('4 explain simply: a French course never has a French interface (production rule), so Lexi explains in Ukrainian; the exam reply «Перекласти українською» shows the translation the Worker sent with the reply (no second request); a same-language request (French / French) gets the Worker rule «very simple French»');

  // 5 switching the interface language: the exercise stays, the explanation language follows the interface
  { const {ctx, page, errors} = await open('uk'); const before = await quiz(page);
   await page.click('#card .lesson-help'); await page.waitForSelector(S + '#draft'); let c = await send(page, 'Waarom?'); const q = c.app.profile.question; assert.equal(c.app.lang, 'uk');
   await page.evaluate(() => lexiClose());
   for (const [ui, name] of [['en', 'English'], ['fr', 'French'], ['ar', 'Arabic']]) {
    await page.evaluate(u => changeUiLang(u), ui); await page.waitForTimeout(300); // the settings switch
    await quiz(page); await page.click('#card .lesson-help'); await page.waitForSelector(S + '#draft');
    c = await send(page, 'Why?'); assert.equal(c.app.lang, ui, 'interface ' + ui); assert.ok(c.app.profile.question, ui + ': the exercise is sent');
    assert.ok(new RegExp('in ' + name).test(c.system), ui + ': explained in ' + name); assert.equal(c.app.target, 'nl');
    assert.equal(await page.evaluate(() => document.documentElement.lang), ui); if (ui === 'ar') assert.equal(await page.evaluate(() => document.documentElement.dir), 'rtl');
    await page.evaluate(() => lexiClose());
   }
   assert.deepEqual(errors, []); await ctx.close(); }
  pass('5 language switch uk → en → fr → ar: every request explains in the new interface language, the exercise is still sent, ar is right-to-left');

  // 7 losing the connection mid-conversation, then back online: retry, the exercise is kept
  { const {ctx, page, errors} = await open('uk'); await quiz(page); await page.click('#card .lesson-help'); await page.waitForSelector(S + '#draft');
   let c = await send(page, 'Waarom?'); const q = c.app.profile.question;
   await ctx.setOffline(true); await page.evaluate(() => dispatchEvent(new Event('offline')));
   const n0 = calls.length; await page.fill(S + '#draft', 'Nog iets?').catch(() => {}); await page.locator(S + 'button.send').click({timeout: 1500}).catch(() => {}); await page.waitForTimeout(600);
   assert.equal(calls.length, n0, 'offline: no request'); assert.match(await text(page), /інтернет|зв’язку|офлайн|мережі/i, 'offline message in Ukrainian');
   await ctx.setOffline(false); await page.evaluate(() => dispatchEvent(new Event('online')));
   const retry = page.locator(S + '[data-action="retry"]');
   if (await retry.count()) { await retry.first().click(); for (let i = 0; i < 60 && calls.length === n0; i++) await page.waitForTimeout(50); await page.waitForTimeout(300) }
   else c = await send(page, 'Nog iets?');
   c = conv(n0); assert.ok(c, 'back online: the question is sent'); assert.equal(c.app.profile.question, q, 'back online: same exercise');
   assert.match(await text(page), /Uitleg: Nog iets\?/, 'the answer arrives');
   assert.deepEqual(errors, []); await ctx.close(); }
  pass('7 offline: nothing sent, a Ukrainian offline message; back online the question goes out with the same exercise and is answered');

  // 9 a very long message
  { const {ctx, page, errors} = await open('uk'); await page.evaluate(() => lexiOpen('free', {})); await page.waitForSelector(S + '#draft');
   const max = +(await page.locator(S + '#draft').getAttribute('maxlength'));
   await page.fill(S + '#draft', 'Ik woon in Gent en ik werk in Brussel. '.repeat(150)); const len = (await page.locator(S + '#draft').inputValue()).length;
   assert.ok(max > 0 && len <= max, 'the input stops at ' + max + ' characters (got ' + len + ')');
   await page.click(S + 'button.send'); for (let i = 0; i < 80; i++) { await page.waitForTimeout(50); if (!(await page.locator(S + '.lexi-thinking').count()) && calls.at(-1)?.system) break }
   const c = conv(); assert.ok(c.messages.at(-1).content.length <= 400, 'the model gets at most 400 characters'); assert.match(await text(page), /Leuk! Vertel meer\./);
   await page.evaluate(() => { const d = document.querySelector('.lexi-host').shadowRoot.querySelector('#draft'); d.removeAttribute('maxlength'); d.value = 'x'.repeat(5000); d.dispatchEvent(new Event('input', {bubbles: true})) });
   const n0 = calls.length; await page.click(S + 'button.send'); await page.waitForTimeout(500);
   assert.equal(calls.length, n0, 'a 5000-character message forced past the input limit is not sent'); assert.equal(await page.locator('.lexi-host').count(), 1, 'Lexi stays open');
   assert.deepEqual(errors, []); await ctx.close(); }
  pass('9 long message: the input stops at its limit, the model gets ≤ 400 characters, a forced 5000-character message is refused locally; no page error');

  // 10 broken Worker answers: model error, model text instead of JSON, an HTML page, empty JSON — error panel, Retry works, exercise kept
  { const {ctx, page, errors} = await open('uk'); await quiz(page); await page.click('#card .lesson-help'); await page.waitForSelector(S + '#draft');
   let c = await send(page, 'Waarom?'); const q = c.app.profile.question;
   for (const [name, set] of [['model 500', () => { model = '500' }], ['model text', () => { model = 'text' }], ['HTML page', () => { raw = {status: 200, body: '<html>Cloudflare</html>'} }],
    ['empty JSON', () => { raw = {status: 200, type: 'application/json', body: '{}'} }], ['502 page', () => { raw = {status: 502, body: 'Bad gateway'} }]]) {
    set(); const n0 = calls.length; await page.fill(S + '#draft', 'Vraag ' + name); await page.click(S + 'button.send');
    await page.waitForSelector(S + '.error-panel', {timeout: 15000}); assert.equal(calls.length - n0, 1, name + ': one request');
    assert.equal(await page.locator(S + '.error-panel [data-action="retry"]').count(), 1, name + ': Retry offered');
    model = 'ok'; raw = null; const n1 = calls.length; await page.click(S + '.error-panel [data-action="retry"]');
    for (let i = 0; i < 80 && (calls.length === n1 || await page.locator(S + '.lexi-thinking').count()); i++) await page.waitForTimeout(50); await page.waitForTimeout(250);
    assert.equal(calls.length - n1, 1, name + ': one retry request'); assert.equal(conv(n1).app.profile.question, q, name + ': retry keeps the exercise');
    assert.equal(await page.locator(S + '.error-panel').count(), 0, name + ': the answer clears the error');
   }
   assert.deepEqual(errors, []); await ctx.close(); }
  pass('10 broken answers (model 500, text instead of JSON, an HTML page, empty JSON, a 502 page): error panel + Retry, one request each, the retry keeps the exercise');
  realLog('PASS: Lexi end to end through the proposed Worker — 10 scenarios');
 } finally { console.log = realLog; await browser.close(); server.close() }
})().catch(e => { console.error(e); process.exit(1) });
