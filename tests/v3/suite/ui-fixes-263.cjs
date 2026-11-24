// LerenBe 3.0 (PR #63) · fixes from the owner's real-AI test on a MacBook (Chrome + Safari), 2026-11-22:
// 1. the «Read aloud» and «Report» buttons under a Lexi reply stand on one line (Report was ~7 px lower);
// 2. the eyebrow above «Let's talk with Lexi» is translated (was the English «GAMIFIED BELGIUM» in every language);
// 3. the language codes in Settings match the header switcher (UK / EN / FR / AR, not UKR / ENG / FRA next to UK);
// 4. «I'm learning» with only the Dutch course live: its levels sit side by side across the panel (was one narrow column
//    and an empty panel); the course badge is the Belgian flag, as in Settings;
// 5. the course progress bar of the hero stays inside its footer (Safari drew it past the card edge).
// Chromium emulation; the Safari drawing of 5 is checked by the rule (column, width 100 %), not by WebKit.
const assert = require('node:assert/strict');
let browser; try { ({browser} = require('../tools/test-043/serve.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const fs = require('node:fs'), path = require('node:path'), {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
const EYEBROW = {uk: 'Розмовна практика', en: 'Speaking practice', fr: 'Pratique orale', ar: 'تدريب على المحادثة'};
(async () => {
 let B; try { B = await browser() } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 await B.b.close(); const {chromium} = require('playwright'), br = await chromium.launch(); const bad = [];
 try {
  for (const ui of ['uk', 'en', 'fr', 'ar']) {
   const ctx = await br.newContext({viewport: {width: 1440, height: 900}, serviceWorkers: 'block'});
   await ctx.route('**/*', r => { const u = r.request().url(); if (u.includes('/mock-ai/')) return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({reply: 'Goed zo! Waar werk je?', reply_nl: 'Goed zo! Waar werk je?', translation: '—', correction: null, answer: '—', examples: []})}); return u.startsWith(B.base) ? r.continue() : r.abort() });
   const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
   await page.addInitScript(s => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, {leren_release_seen: JSON.stringify(rel), poly_ui: ui, poly_target: 'nl', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_ai_consent18: 'true', leren_char: '"lexi"', leren_tour_done: 'true', leren_ai_endpoint: JSON.stringify(B.base + '/mock-ai/')});
   await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => typeof lexiOpen === 'function' && typeof setView === 'function', null, {timeout: 20000}); await page.waitForTimeout(400);
   // 3 · Settings codes = header codes
   const codes = await page.evaluate(() => ({header: document.getElementById('headerLangCode')?.textContent.trim(), ui: [...document.querySelectorAll('#uiLangPicker option')].map(o => o.textContent.replace(/^\S+\s*/, '')), target: [...document.querySelectorAll('#targetLangPicker option')].map(o => o.textContent.replace(/^\S+\s*/, ''))}));
   if (codes.header !== ui.toUpperCase()) bad.push(ui + ': header code ' + codes.header);
   if (codes.ui.join() !== 'UK,EN,FR,AR') bad.push(ui + ': settings explanation codes ' + codes.ui.join());
   if (codes.target.some(c => c.length !== 2)) bad.push(ui + ': settings learning codes ' + codes.target.join());
   // 4 · the «I'm learning» panel and 5 · hero progress footer
   // TEST-050: the «I'm learning» picker lives in the «Навчання» tab (Today is the home); the hero footer is gone with the old home
   await page.evaluate(() => { setView('path'); openLearn() }); await page.waitForSelector('.hv-pick-btn', {timeout: 10000}).catch(() => {}); await page.waitForTimeout(300);
   const home = await page.evaluate(() => { const out = {}; const btn = document.querySelector('.hv-pick-btn'); if (!btn) return {missing: true}; btn.click();
    const grid = document.querySelector('.hv-pick-panel .hv-course-grid'), cards = grid ? [...grid.children] : [];
    out.solo = cards.length === 1 ? grid.classList.contains('hv-solo') : null;
    const levels = [...document.querySelectorAll('.hv-pick-panel .hv-level')].map(e => e.getBoundingClientRect());
    out.levelsOneRow = levels.length > 1 && levels.every(r => Math.abs(r.top - levels[0].top) < 2);
    const pr = document.querySelector('.hv-pick-panel').getBoundingClientRect(), cr = cards[0]?.getBoundingClientRect(); out.cardFills = cr ? cr.width > pr.width * 0.85 : false;
    const flag = document.querySelector('.hv-pick-btn .hv-flag-nl'); out.flag = flag ? getComputedStyle(flag).backgroundImage : '';
    out.meters = [...document.querySelectorAll('.fh-hero-footer')].map(f => { const m = f.querySelector('.fh-meter'); if (!m) return null; const a = f.getBoundingClientRect(), b = m.getBoundingClientRect(); return b.left >= a.left - 1 && b.right <= a.right + 1 }).filter(x => x !== null);
    return out });
   if (home.missing) bad.push(ui + ': no «I am learning» button');
   else {
    if (home.solo === false) bad.push(ui + ': single course without the hv-solo layout');
    if (home.solo && !home.levelsOneRow) bad.push(ui + ': Dutch levels not side by side'); if (home.solo && !home.cardFills) bad.push(ui + ': the single course card does not fill the panel');
    if (!/253, 218, 36|FDDA24/i.test(home.flag)) bad.push(ui + ': the Dutch course badge is not the Belgian flag (' + home.flag.slice(0, 60) + ')');
    if (home.meters.includes(false)) bad.push(ui + ': hero progress bar outside its footer');
   }
   // 2 · eyebrow and 1 · reply buttons
   await page.evaluate(() => lexiOpen('free', {})); await page.waitForFunction(() => document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'), null, {timeout: 15000});
   const eyebrow = await page.evaluate(() => document.querySelector('.lexi-host').shadowRoot.querySelector('.welcome .eyebrow')?.textContent.trim());
   if (eyebrow !== EYEBROW[ui]) bad.push(ui + ': eyebrow «' + eyebrow + '»');
   await page.fill('.lexi-host >> #draft', 'Ik werk in Gent.'); await page.click('.lexi-host >> button.send');
   await page.waitForFunction(() => document.querySelector('.lexi-host').shadowRoot.querySelector('.g-bub.them .message-voice'), null, {timeout: 15000}); await page.waitForTimeout(300);
   const btns = await page.evaluate(() => [...document.querySelector('.lexi-host').shadowRoot.querySelectorAll('.g-bub.them .message-voice')].map(e => { const r = e.getBoundingClientRect(); return {t: e.textContent.trim().slice(0, 16), top: Math.round(r.top), bottom: Math.round(r.bottom)} }));
   if (btns.length < 2) bad.push(ui + ': expected «Read aloud» and «Report» under the reply, got ' + btns.length);
   else if (Math.abs(btns[0].top - btns[1].top) > 1 || Math.abs(btns[0].bottom - btns[1].bottom) > 1) bad.push(ui + ': reply buttons not on one line ' + JSON.stringify(btns));
   if (errors.length) bad.push(ui + ': page errors ' + errors.join(' / ').slice(0, 160));
   await ctx.close();
  }
 } finally { await br.close(); B.close?.() }
 if (bad.length) { console.log(bad.join('\n')); assert.fail(bad.length + ' problem(s)') }
 console.log('PASS: owner test fixes — uk / en / fr / ar: Lexi reply buttons on one line, translated eyebrow, Settings codes = header codes (UK/EN/FR/AR), single Dutch course laid out across the picker with the Belgian flag, hero progress bar inside its footer');
})().catch(e => { console.error(e.message); process.exit(1) });
