// Owner test 2026-11-22 (production 263): «Не знаю, що відповісти» stood under Lexi's de/het explanation, where there was nothing to answer.
// The button («Допоможи відповісти») is shown only when Lexi's last reply asks the learner something: not after an explanation
// without a question, not after a reply to a question about the language (asks_about_language from the Worker), and not in Lexi's
// question/answer modes. uk/en/fr/ar labels. MOCK AI on the same origin (no real model, no Worker). Chromium.
const assert = require('node:assert/strict');
let browser; try { ({browser} = require('../tools/test-043/serve.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const fs = require('node:fs'), path = require('node:path'), {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
const LABEL = {uk: 'Допоможи відповісти', en: 'Help me answer', fr: 'Aide-moi à répondre', ar: 'ساعدني على الرد'};
const R = (reply, extra = {}) => ({reply, reply_nl: reply, translation: '—', correction: null, ...extra});
const STEPS = [
 ['Hallo', R('Hallo! Wat doe je vandaag?'), true, 'Lexi asks a question'],
 ['de of het huis?', R('Het is «het huis»: woorden op -je zijn altijd het.', {asks_about_language: true}), false, 'grammar explanation, no question'],
 ['winkelkar як ще можна сказати?', R('Je kunt ook «kar» zeggen. Wil je nog een woord?', {asks_about_language: true}), false, 'answer to a question about the language, even with a «?»'],
 ['Ik werk in Gent.', R('Leuk, Gent is mooi.'), false, 'a plain reply without a question'],
 ['Ja.', R('Wat werk je daar?'), true, 'a question again']];
(async () => {
 let B; try { B = await browser() } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 await B.b.close(); const {chromium} = require('playwright'), br = await chromium.launch(); const bad = [];
 try {
  for (const ui of ['uk', 'en', 'fr', 'ar']) {
   const ctx = await br.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, serviceWorkers: 'block'}); const queue = STEPS.map(s => s[1]);
   await ctx.route('**/*', r => { const u = r.request().url(); if (u.includes('/mock-ai/')) { const j = JSON.parse(r.request().postData() || '{}'); const body = j.mode === 'memo' ? {memory: ''} : j.mode === 'chat' ? queue.shift() : {answer: '—', examples: []}; return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(body)}) } return u.startsWith(B.base) ? r.continue() : r.abort() });
   const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
   await page.addInitScript(s => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, {leren_release_seen: JSON.stringify(rel), poly_ui: ui, poly_target: 'nl', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_ai_consent18: 'true', leren_char: '"lexi"', leren_tour_done: 'true', leren_ai_endpoint: JSON.stringify(B.base + '/mock-ai/')});
   await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => typeof lexiOpen === 'function', null, {timeout: 20000});
   await page.evaluate(() => lexiOpen('free', {})); await page.waitForFunction(() => document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'), null, {timeout: 15000});
   const help = () => page.evaluate(() => [...document.querySelector('.lexi-host').shadowRoot.querySelectorAll('[data-action=help]')].map(b => b.textContent.trim()));
   if ((await help()).length) bad.push(ui + ': help before Lexi said anything');
   for (const [said, , want, why] of STEPS) {
    const n = await page.evaluate(() => document.querySelector('.lexi-host').shadowRoot.querySelectorAll('.g-bub.them').length);
    await page.fill('.lexi-host >> #draft', said); await page.click('.lexi-host >> button.send');
    await page.waitForFunction(n => { const r = document.querySelector('.lexi-host').shadowRoot; return r.querySelectorAll('.g-bub.them').length > n && r.querySelector('.chat-log').getAttribute('aria-busy') !== 'true' }, n, {timeout: 15000}); await page.waitForTimeout(150);
    const h = await help();
    if (want && (h.length !== 1 || h[0] !== LABEL[ui])) bad.push(ui + ': ' + why + ' → expected «' + LABEL[ui] + '», got ' + JSON.stringify(h));
    if (!want && h.length) bad.push(ui + ': ' + why + ' → no help button expected, got ' + JSON.stringify(h));
   }
   if (errors.length) bad.push(ui + ': page errors ' + errors.join(' / ').slice(0, 160));
   await ctx.close();
  }
 } finally { await br.close(); B.close?.() }
 if (bad.length) { console.log(bad.join('\n')); assert.fail(bad.length + ' problem(s)') }
 console.log('PASS: «help me answer» only after a reply that asks the learner something — uk / en / fr / ar: shown after a question, hidden after a grammar explanation, after an answer about the language and after a plain reply');
})().catch(e => { console.error(e.message); process.exit(1) });
