// LerenBe 3.0 quality audit · Lexi context actions. Owner screenshot on production 263: «Не знаю, що відповісти» stood under
// Lexi's de/het explanation, where there was nothing to answer. The action under Lexi's LAST reply now follows the structured
// reply type from the Worker (reply_type in chat, answer_type in Lexi's question modes):
//   A question → «Допоможи відповісти»   B grammar / explanation → «Поясни простіше»   C translation → «Покажи приклади»
//   D correction → «Спробувати ще раз» (opens the practice of that correction)   E conversation → no button.
// Older Worker answers without a type fall back safely (correction → try again, a question about the language → explain more
// simply, a «?» → help me answer, else nothing). A question about the language is explained in the interface language first
// (explain), the Dutch reply follows. Voice and report buttons stay under every reply. uk/en/fr/ar, MOCK AI (no real model).
const assert = require('node:assert/strict');
let browser; try { ({browser} = require('../tools/test-043/serve.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const fs = require('node:fs'), path = require('node:path'), {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
const LABEL = {
 uk: {help: 'Допоможи відповісти', simpler: 'Поясни простіше', examples: 'Покажи приклади', retry: 'Спробувати ще раз', simplerTitle: 'Простіше пояснення', examplesTitle: 'Приклади'},
 en: {help: 'Help me answer', simpler: 'Explain more simply', examples: 'Show examples', retry: 'Try again', simplerTitle: 'A simpler explanation', examplesTitle: 'Examples'},
 fr: {help: 'Aide-moi à répondre', simpler: 'Explique plus simplement', examples: 'Montre des exemples', retry: 'Réessayer', simplerTitle: 'Explication plus simple', examplesTitle: 'Exemples'},
 ar: {help: 'ساعدني على الرد', simpler: 'اشرح بشكل أبسط', examples: 'أرني أمثلة', retry: 'حاول مرة أخرى', simplerTitle: 'شرح أبسط', examplesTitle: 'أمثلة'}};
const R = (reply, extra = {}) => ({reply, reply_nl: reply, translation: '—', correction: null, ...extra});
const EXPLAIN = 'Слова на «-je» завжди мають «het»: «het huisje». Але «de/het» здебільшого треба вчити разом зі словом.';
const FIX = {has_error: true, severity: 'major', original: 'Ik werken in Gent', corrected: 'Ik werk in Gent.', explanation: 'Після «ik» — «werk».'};
// [learner says, mock reply, expected action, why]
const STEPS = [
 ['Hallo', R('Hallo! Wat doe je vandaag?', {reply_type: 'question'}), 'help', 'A · Lexi asks a question'],
 ['de of het huisje?', R('Wil je nog een woord proberen?', {reply_type: 'grammar', asks_about_language: true, explain: EXPLAIN}), 'simpler', 'B · grammar explanation (its follow-up «?» does not make it a question)'],
 ['Wat betekent winkelkar?', R('Een winkelkar is een kar in de winkel.', {reply_type: 'translation'}), 'examples', 'C · translation of a word'],
 ['Ik werken in Gent', R('Waar in Gent?', {reply_type: 'question', correction: FIX}), 'retry', 'D · correction (wins over the question)'],
 ['Leuk.', R('Gent is mooi.', {reply_type: 'conversation'}), null, 'E · plain conversation'],
 ['Ja, zeker.', R('Wat werk je daar?'), 'help', 'older Worker: a «?» → help me answer'],
 ['de of het?', R('Het is «het huis».', {asks_about_language: true}), 'simpler', 'older Worker: question about the language → explain more simply'],
 ['Oké.', R('Tot straks.'), null, 'older Worker: plain reply → no button']];
(async () => {
 let B; try { B = await browser() } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 await B.b.close(); const {chromium} = require('playwright'), br = await chromium.launch(); const bad = [];
 try {
  for (const ui of ['uk', 'en', 'fr', 'ar']) {
   const L = LABEL[ui], ctx = await br.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
   const queue = STEPS.map(s => s[1]), asks = [], seen = []; let askReply = null;
   await ctx.route('**/*', r => { const u = r.request().url(); if (u.includes('/mock-ai/')) { const j = JSON.parse(r.request().postData() || '{}'); seen.push(j);
     const body = j.mode === 'memo' ? {memory: ''} : j.mode === 'report' ? {ok: true} : j.mode === 'chat' ? queue.shift() : (asks.push(j), askReply || {answer: 'Простіше: «het» — для слів на «-je».', answer_type: 'other', examples: [{lang: 'nl', text: 'het huisje', translation: 'будиночок'}, {lang: 'nl', text: 'het meisje', translation: 'дівчинка'}, {lang: 'nl', text: 'het katje', translation: 'кошеня'}]});
     return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(body)}) } return u.startsWith(B.base) ? r.continue() : r.abort() });
   const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
   await page.addInitScript(s => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, {leren_release_seen: JSON.stringify(rel), poly_ui: ui, poly_target: 'nl', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_ai_consent18: 'true', leren_char: '"lexi"', leren_tour_done: 'true', leren_ai_endpoint: JSON.stringify(B.base + '/mock-ai/')});
   await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => typeof lexiOpen === 'function', null, {timeout: 20000});
   await page.evaluate(() => lexiOpen('free', {})); await page.waitForFunction(() => document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'), null, {timeout: 15000});
   const S = '.lexi-host >> ', shadow = fn => page.evaluate(fn);
   const actions = () => shadow(() => [...document.querySelector('.lexi-host').shadowRoot.querySelectorAll('.ac-tools .help-button')].map(b => ({a: b.dataset.action, t: b.textContent.trim()})));
   const say = async text => { const n = await shadow(() => document.querySelector('.lexi-host').shadowRoot.querySelectorAll('.g-bub.them').length);
    await page.fill(S + '#draft', text); await page.click(S + 'button.send');
    await page.waitForFunction(n => { const r = document.querySelector('.lexi-host').shadowRoot; return r.querySelectorAll('.g-bub.them').length > n && r.querySelector('.chat-log').getAttribute('aria-busy') !== 'true' }, n, {timeout: 15000}); await page.waitForTimeout(120) };
   if ((await actions()).length) bad.push(ui + ': an action before Lexi said anything');
   for (const [said, , want, why] of STEPS) {
    await say(said); const a = await actions();
    if (want && (a.length !== 1 || a[0].a !== want || a[0].t !== L[want])) bad.push(ui + ': ' + why + ' → expected «' + L[want] + '», got ' + JSON.stringify(a));
    if (!want && a.length) bad.push(ui + ': ' + why + ' → no action expected, got ' + JSON.stringify(a));
    const under = await shadow(() => { const b = [...document.querySelector('.lexi-host').shadowRoot.querySelectorAll('.g-bub.them')].at(-1); return {voice: !!b.querySelector('[data-action=speak]'), report: !!b.querySelector('[data-action=report]')} });
    if (!under.voice) bad.push(ui + ': ' + why + ' → «Read aloud» missing under the reply');
    if (why.startsWith('B')) {
     // the explanation comes first, in the interface language; the Dutch reply follows
     const order = await shadow(() => { const b = [...document.querySelector('.lexi-host').shadowRoot.querySelectorAll('.g-bub.them')].at(-1), e = b.querySelector('.lexi-explain'), d = b.querySelector('p[lang=nl]'); return {e: e?.textContent, first: !!e && !!d && !!(e.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING)} });
     if (order.e !== EXPLAIN || !order.first) bad.push(ui + ': B · explanation not shown first in the interface language ' + JSON.stringify(order));
     const n = asks.length; await page.click(S + '.ac-tools [data-action=simpler]'); await page.waitForSelector(S + '.ac-hint');
     const q = asks[n]; if (!q || !/much more simply/.test(q.messages?.at(-1)?.content || '') || !(q.messages.at(-1).content.includes('-je'))) bad.push(ui + ': B · «explain more simply» did not ask for a simpler explanation of that explanation');
     const hint = await shadow(() => { const h = document.querySelector('.lexi-host').shadowRoot.querySelector('.ac-hint'); return {h3: h.querySelector('h3').textContent.trim(), ex: h.querySelectorAll('.ac-example').length} });
     if (hint.h3 !== L.simplerTitle || hint.ex !== 3) bad.push(ui + ': B · simpler explanation panel ' + JSON.stringify(hint));
    }
    if (why.startsWith('C')) { const n = asks.length; await page.click(S + '.ac-tools [data-action=examples]'); await page.waitForSelector(S + '.ac-hint');
     if (!/3 natural/.test(asks[n]?.messages?.at(-1)?.content || '')) bad.push(ui + ': C · «show examples» did not ask for three sentences');
     if ((await shadow(() => document.querySelector('.lexi-host').shadowRoot.querySelector('.ac-hint h3').textContent.trim())) !== L.examplesTitle) bad.push(ui + ': C · examples panel title'); }
    if (why.startsWith('A')) { const n = asks.length; await page.click(S + '.ac-tools [data-action=help]'); await page.waitForSelector(S + '.ac-hint');
     const p = asks[n]?.messages?.at(-1)?.content || ''; if (!/2–3 short possible answers/.test(p) || !/what the question means/.test(p)) bad.push(ui + ': A · help does not ask to explain the question and give 2–3 answers');
     if ((await shadow(() => document.querySelector('.lexi-host').shadowRoot.querySelectorAll('.ac-hint .ac-example').length)) !== 3) bad.push(ui + ': A · expected up to 3 example answers'); }
    if (why.startsWith('D')) { await page.click(S + '.ac-tools [data-action=retry]'); await page.waitForSelector(S + '.ac-practice');
     const ex = await shadow(() => document.querySelector('.lexi-host').shadowRoot.querySelector('.ac-practice .ac-example').textContent.trim());
     if (ex !== FIX.corrected) bad.push(ui + ': D · try again opens the practice of another sentence: ' + ex);
     await page.click(S + '[data-action=closePractice]'); }
   }
   // Lexi's grammar mode (question / answer): answer_type grammar → explain more simply; other → nothing
   await page.evaluate(() => lexiOpen('grammar', {})); await page.waitForFunction(() => document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'), null, {timeout: 15000});
   askReply = {answer: '«de» of «het»: je leert het lidwoord samen met het woord.', answer_type: 'grammar', examples: []}; await say('de of het?');
   let a = await actions(); if (a.length !== 1 || a[0].a !== 'simpler') bad.push(ui + ': grammar mode · grammar answer → expected «' + L.simpler + '», got ' + JSON.stringify(a));
   askReply = {answer: 'Leer elke dag 5 minuten.', answer_type: 'other', examples: []}; await say('Hoe leer ik woorden?');
   a = await actions(); if (a.length) bad.push(ui + ': grammar mode · a study tip → no action expected, got ' + JSON.stringify(a));
   askReply = {answer: 'Het lijkt op het oude antwoord.', examples: []}; await say('En dit?');
   a = await actions(); if (a.length) bad.push(ui + ': grammar mode · older Worker without answer_type → no action expected, got ' + JSON.stringify(a));
   if (errors.length) bad.push(ui + ': page errors ' + errors.join(' / ').slice(0, 160));
   await ctx.close();
  }
 } finally { await br.close(); B.close?.() }
 if (bad.length) { console.log(bad.join('\n')); assert.fail(bad.length + ' problem(s)') }
 console.log('PASS: Lexi context actions — uk / en / fr / ar: question → help me answer (explains the question, 2–3 answers), grammar → explain more simply, translation → show examples, correction → try again (practice of that sentence), conversation → none; older Worker replies fall back safely; a question about the language is explained first in the interface language; grammar mode follows answer_type; «Read aloud» stays');
})().catch(e => { console.error(e.message); process.exit(1) });
