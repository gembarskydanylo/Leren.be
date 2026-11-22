// LerenBe 3.0 · release 264 · Lexi scenario set (tools/lexi-scenarios-264.cjs, 36 scenarios: uk / en / fr / ar × nl / en / fr ×
// A1.1 / A1.2 / A2.1 × free talk, speaking, real-life situation, grammar, Lesson Help). MOCK model only, no AI, no network:
// the app → LerenLexi engine → the real proposed Worker code (docs/integration-3.0/ai-worker.lexi-proposed.js, in this process)
// → a scripted model answer. Older Worker answers (263 and before) are served raw, past the Worker. Checks per scenario:
//  · the request the Worker builds: interface language, studied language and level in the prompt; the Lesson Help rule that
//    keeps the solution until the learner answered (and only then);
//  · the action under Lexi's reply (help / explain more simply / show examples / try again / none) and its label;
//  · a question about the language: the explanation comes first, in the interface language; no «Better:» card;
//  · AI requests: none between the reply and a click; a double click on an action makes exactly ONE request (with the
//    right instruction); «try again» opens the practice without any request; «Read aloud» stays under the reply.
const assert = require('node:assert/strict');
let browser; try { ({browser} = require('../tools/test-043/serve.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const fs = require('node:fs'), path = require('node:path'), {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
const {S, LANG_RE} = require(path.join(repo, 'app/tools/lexi-scenarios-264.cjs'));
const src = fs.readFileSync(path.join(repo, 'app/docs/integration-3.0/ai-worker.lexi-proposed.js'), 'utf8');
const LABEL = {uk: {help: 'Допоможи відповісти', simpler: 'Поясни простіше', examples: 'Покажи приклади', retry: 'Спробувати ще раз'},
 en: {help: 'Help me answer', simpler: 'Explain more simply', examples: 'Show examples', retry: 'Try again'},
 fr: {help: 'Aide-moi à répondre', simpler: 'Explique plus simplement', examples: 'Montre des exemples', retry: 'Réessayer'},
 ar: {help: 'ساعدني على الرد', simpler: 'اشرح بشكل أبسط', examples: 'أرني أمثلة', retry: 'حاول مرة أخرى'}};
const INSTR = {help: /2–3 short possible answers/, simpler: /much more simply/, examples: /3 natural/};
const LNAME = {uk: 'Ukrainian', en: 'English', fr: 'French', ar: 'Arabic'}, TNAME = {nl: 'Dutch', en: 'English', fr: 'French'}, LEVEL = {a11: 'A1.1', a12: 'A1.2', a21: 'A2.1'};
const kv = () => { const m = new Map(); return {async get(k) { return m.get(k) ?? null }, async put(k, v) { m.set(k, v) }} };
const limiter = () => ({async limit() { return {success: true} }});
(async () => {
 let B; try { B = await browser() } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 await B.b.close();
 const W = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default;
 // all scenarios come from one test «network»: the daily quotas (60 / 150, tested in worker-security) would stop the set after
 // ~40 scenarios, so this run lifts them; per-minute limiters are mocked as always open
 const env = {PROVIDER: 'anthropic', ANTHROPIC_KEY: 'sk-test', RATE: kv(), PER_IP: limiter(), IP_CEIL: limiter(), ALL: limiter(), DAILY_LIMIT: '5000', DAILY_IP_LIMIT: '5000'};
 let cur = null, sent = [];
 const realFetch = globalThis.fetch;
 globalThis.fetch = async (url, opt) => { if (!String(url).includes('api.anthropic.com')) return realFetch(url, opt);
  const b = JSON.parse(opt.body); sent.push(b); const schema = JSON.stringify(b.output_config?.format?.schema || {});
  const out = /"memory"/.test(schema) ? {memory: ''} : cur.turns++ === 0 ? cur.s.model : {answer_type: 'other', answer: 'Підказка / hint.', examples: [{lang: cur.s.target, text: 'Ik woon in Gent.', translation: '—'}, {lang: cur.s.target, text: 'Ik werk in Gent.', translation: '—'}]};
  return {ok: true, status: 200, json: async () => ({stop_reason: 'end_turn', usage: {}, content: [{type: 'text', text: JSON.stringify(out)}]})} };
 const {chromium} = require('playwright'), br = await chromium.launch(); const bad = [], done = {actions: {}, legacy: 0, lesson: 0};
 try {
  for (const s of S) {
   const fail = m => bad.push(s.id + ': ' + m);
   cur = {s, turns: 0}; sent = []; const app = [];
   const ctx = await br.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
   await ctx.route('**/*', async r => { const u = r.request().url(); if (!u.includes('/mock-ai/')) return u.startsWith(B.base) ? r.continue() : r.abort();
    if (r.request().method() !== 'POST') return r.fulfill({status: 204});
    const body = JSON.parse(r.request().postData() || '{}'); app.push(body);
    if (s.legacy && body.mode !== 'memo' && cur.turns++ === 0) return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(s.legacy)});
    if (s.legacy && body.mode === 'ask' && cur.turns > 1) cur.turns = 2; // later requests of a legacy scenario go through the Worker (the action click)
    const res = await W.fetch(new Request('https://leren-ai.example/', {method: 'POST', headers: {Origin: 'https://lerenbe.com', 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.9', 'X-Leren-Device': 'd'.repeat(24)}, body: JSON.stringify(body)}), env, {waitUntil() {}});
    return r.fulfill({status: res.status, contentType: 'application/json', body: await res.text()}) });
   const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
   await page.addInitScript(o => { localStorage.clear(); for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v) }, {leren_release_seen: JSON.stringify(rel), poly_ui: s.ui, poly_target: s.target, leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_ai_consent18: 'true', leren_char: '"lexi"', leren_tour_done: 'true', leren_level_asked: 'true', leren_ai_endpoint: JSON.stringify(B.base + '/mock-ai/')});
   await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => typeof lexiOpen === 'function', null, {timeout: 20000});
   await page.evaluate(([lvl, sc, c]) => { curLevel = lvl; lexiOpen(sc, c) }, [s.level, s.scenario, s.ctx || {}]);
   await page.waitForFunction(() => document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'), null, {timeout: 15000});
   const R = () => document.querySelector('.lexi-host').shadowRoot;
   const n0 = await page.evaluate(R => 0, null), them0 = await page.evaluate(() => document.querySelector('.lexi-host').shadowRoot.querySelectorAll('.g-bub.them').length);
   await page.fill('.lexi-host >> #draft', s.say); await page.click('.lexi-host >> button.send');
   await page.waitForFunction(n => { const r = document.querySelector('.lexi-host').shadowRoot; return r.querySelectorAll('.g-bub.them').length > n && r.querySelector('.chat-log').getAttribute('aria-busy') !== 'true' }, them0, {timeout: 15000}).catch(() => fail('no reply'));
   await page.waitForTimeout(600);
   // the request the app sent and the prompt the Worker built
   const main = app.find(b => b.mode !== 'memo');
   if (!main) { fail('no AI request'); await ctx.close(); continue }
   if (main.lang !== s.ui || (main.target || 'nl') !== s.target || main.level !== s.level) fail(`request ui/target/level ${main.lang}/${main.target}/${main.level}`);
   if (!s.legacy) {
    const sys = (sent.find(b => !/"memory"/.test(JSON.stringify(b.output_config || {}))) || {system: []}).system.map(x => x.text).join('');
    if (!sys.includes(LNAME[s.ui])) fail('prompt without the interface language ' + LNAME[s.ui]);
    if (!sys.includes(TNAME[s.target])) fail('prompt without the studied language ' + TNAME[s.target]);
    if (!sys.includes(LEVEL[s.level])) fail('prompt without the level ' + LEVEL[s.level]);
    const rule = /has NOT answered this exercise yet/.test(sys);
    if (!!s.expect.noSolution !== rule) fail('Lesson Help «no solution» rule ' + (rule ? 'present' : 'missing'));
    if (s.scenario === 'lesson') { done.lesson++; if (s.ctx.answer && !/the learner's answer to it/.test(sys)) fail('the learner\'s answer is not in the prompt') }
   } else done.legacy++;
   // the reply, the explanation, the action
   const view = await page.evaluate(() => { const r = document.querySelector('.lexi-host').shadowRoot, b = [...r.querySelectorAll('.g-bub.them')].at(-1);
    return {acts: [...r.querySelectorAll('.ac-tools .help-button')].map(x => ({a: x.dataset.action, t: x.textContent.trim()})), explain: b.querySelector('.lexi-explain')?.textContent || '',
     explainFirst: (() => { const e = b.querySelector('.lexi-explain'), d = b.querySelector('p[lang]'); return !!e && !!d && !!(e.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) })(),
     fix: !!b.querySelector('.ai-fix, .light-fix'), voice: !!b.querySelector('[data-action=speak]')} });
   const want = s.expect.action;
   if (want && (view.acts.length !== 1 || view.acts[0].a !== want || view.acts[0].t !== LABEL[s.ui][want])) fail(`expected «${LABEL[s.ui][want]}», got ${JSON.stringify(view.acts)}`);
   if (!want && view.acts.length) fail('no action expected, got ' + JSON.stringify(view.acts));
   if (s.expect.explain && !(view.explainFirst && LANG_RE[s.ui].test(view.explain))) fail('explanation not first / not in ' + s.ui + ': «' + view.explain.slice(0, 40) + '»');
   if (s.expect.noExplain && view.explain) fail('an explanation without a question about the language was shown');
   if (s.expect.noCorrection && view.fix) fail('a «Better:» / correction card was shown');
   if (s.expect.correction && !view.fix) fail('the correction card is missing');
   if (!view.voice && s.scenario !== 'grammar' && s.scenario !== 'lesson') fail('«Read aloud» missing');
   // AI requests: nothing more until the learner clicks; one request per action
   const before = app.filter(b => b.mode !== 'memo').length; await page.waitForTimeout(400);
   if (app.filter(b => b.mode !== 'memo').length !== before) fail('an AI request without a click');
   if (want && view.acts.some(x => x.a === want)) {
    done.actions[want] = (done.actions[want] || 0) + 1;
    const box = await page.locator(`.lexi-host >> .ac-tools [data-action=${want}]`).boundingBox(); await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    if (want === 'retry') { await page.waitForSelector('.lexi-host >> .ac-practice', {timeout: 5000}).catch(() => fail('«try again» did not open the practice')); await page.waitForTimeout(300);
     if (app.filter(b => b.mode !== 'memo').length !== before) fail('«try again» made an AI request') }
    else { await page.waitForSelector('.lexi-host >> .ac-hint', {timeout: 10000}).catch(() => fail('no help panel after the click')); await page.waitForTimeout(400);
     const extra = app.filter(b => b.mode !== 'memo').slice(before);
     if (extra.length !== 1) fail(`a double click made ${extra.length} AI requests (expected 1)`);
     else { const p = extra[0].messages?.at(-1)?.content || ''; if (!INSTR[want].test(p)) fail('the action request has the wrong instruction: ' + p.slice(0, 80)); if (extra[0].mode !== 'ask') fail('the action request is not a question to Lexi') } }
   }
   if (errors.length) fail('page errors ' + errors.join(' / ').slice(0, 160));
   await ctx.close();
  }
 } finally { await br.close(); B.close?.(); globalThis.fetch = realFetch }
 if (bad.length) { console.log(bad.join('\n')); assert.fail(bad.length + ' problem(s) in ' + S.length + ' scenarios') }
 console.log(`PASS: ${S.length} Lexi scenarios (mock model, real Worker code) — actions ${JSON.stringify(done.actions)}, ${done.legacy} older-Worker answers, ${done.lesson} Lesson Help cases: right action and label, explanation first in the interface language, language / level in the prompt, no solution before the learner answered, one AI request per click and none without a click`);
})().catch(e => { console.error(e.stack || e.message); process.exit(1) });
