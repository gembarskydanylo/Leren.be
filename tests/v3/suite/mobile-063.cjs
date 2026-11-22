// LerenBe 3.0 (PR #63) · Mobile screens that mobile-043 does not open: Audio lesson, LIFE (story list and a story scene),
// Lesson Help (the Lexi answer card for the current exercise), Lexi with the on-screen keyboard up, and the bottom navigation.
// Viewports 320×568, 360×800, 390×844, 412×915, 768×1024 and landscape 844×390; uk / en / ar (Arabic = RTL).
// Chromium emulation — NOT a phone. Same checks as mobile-043 (tools/test-043/mobile-lab.cjs measure()): no page error, no
// horizontal overflow, controls ≥ 44 px and inside the viewport, no clipped text, right lang / dir. Plus: the dock buttons do
// not overlap each other, and with the keyboard up the Lexi input and send button stay visible above it.
// Known and accepted, as in mobile-043: the dock label cut at ≤ 340 px in en / ar on Linux fonts (M-2 / M-3).
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
let browser, measure; try { ({browser} = require('../tools/test-043/serve.cjs')); ({measure} = require('../tools/test-043/mobile-lab.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
const VIEWS = [[320, 568], [360, 800], [390, 844], [412, 915], [768, 1024], [844, 390]], LANGS = ['uk', 'en', 'ar'];
const KNOWN = (r, ui, w) => (ui === 'en' || ui === 'ar') && w <= 340 && r.length === 1 && /dock-tx/.test(r[0]);
const APP = {
 audio: async p => { await p.evaluate(() => { lessonMode = 'audio'; mode = 'audio'; setView('lesson'); buildNav(); newRound() }); await p.waitForSelector('#card .opt, #card button', {timeout: 8000}); await p.waitForTimeout(200) },
 lessonHelp: async p => { await p.evaluate(() => { lessonMode = 'quiz'; mode = 'quiz'; setView('lesson'); buildNav(); newRound() }); await p.waitForSelector('#card .opt');
  await p.evaluate(() => document.querySelector('#card .opt').click()); await p.waitForSelector('#card .lesson-help', {timeout: 8000}); await p.click('#card .lesson-help');
  await p.waitForFunction(() => /Les|Lesson|Урок|ⓘ|.{20}/.test(document.querySelector('.lexi-host')?.shadowRoot?.querySelector('.chat-log')?.textContent || ''), null, {timeout: 15000}); await p.waitForTimeout(300) },
 keyboard: async p => { await p.evaluate(() => lexiOpen('free', {})); await p.waitForFunction(() => document.querySelector('.lexi-host')?.shadowRoot?.querySelector('#draft'), null, {timeout: 15000});
  // Android (interactive-widget=resizes-visual): the layout viewport stays, only visualViewport shrinks to the part above the
  // keyboard (≈ 42 % of the screen on a phone, ≈ 55 % in landscape is left). Emulated by overriding visualViewport and firing its resize.
  await p.focus('.lexi-host >> #draft'); await p.evaluate(() => { const vv = window.visualViewport, H = Math.round(innerHeight * (innerWidth > innerHeight ? 0.45 : 0.58));
   Object.defineProperty(vv, 'height', {get: () => H, configurable: true}); Object.defineProperty(vv, 'offsetTop', {get: () => 0, configurable: true}); vv.dispatchEvent(new Event('resize')) }); await p.waitForTimeout(400) },
 dock: async p => { await p.evaluate(() => setView('path')); await p.waitForTimeout(250) },
};
(async () => {
 let B; try { B = await browser() } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 await B.b.close(); const {chromium} = require('playwright'), br = await chromium.launch(); const bad = [], seen = []; let n = 0;
 try {
  for (const [w, h] of VIEWS) for (const ui of LANGS) {
   const ctx = await br.newContext({viewport: {width: w, height: h}, hasTouch: true, serviceWorkers: 'block'});
   await ctx.route('**/*', r => { const u = r.request().url(); if (u.includes('/mock-ai/')) return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({answer: 'Het huis: een het-woord. ' + 'Uitleg. '.repeat(20), examples: [{lang: 'nl', text: 'Het huis is groot.', translation: '—'}]})}); return u.startsWith(B.base) ? r.continue() : r.abort() });
   const seed = {leren_release_seen: JSON.stringify(rel), poly_ui: ui, poly_target: 'nl', leren_home_v1: 'path', leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_ai_consent18: 'true', leren_char: '"lexi"', leren_tour_done: 'true', leren_ai_endpoint: JSON.stringify(B.base + '/mock-ai/')};
   const check = async (page, screen, errors, extra = {}) => {
    const m = await page.evaluate(measure), tag = screen + ' ' + ui + '@' + w + 'x' + h; n++;
    const clipped = KNOWN(m.clipped, ui, w) ? [] : m.clipped, probs = [];
    if (errors.length) probs.push('errors ' + errors.join(' / ').slice(0, 160)); if (m.overflow > 1) probs.push('overflow ' + m.overflow);
    if (m.small.length) probs.push('small ' + m.small.slice(0, 3).join(', ')); if (m.outside.length) probs.push('outside ' + m.outside.slice(0, 3).join(', ')); if (clipped.length) probs.push('clipped ' + clipped.slice(0, 3).join(', '));
    if (!extra.noLang && (m.lang !== ui || (ui === 'ar') !== (m.dir === 'rtl'))) probs.push('lang/dir ' + m.lang + '/' + m.dir);
    for (const p of extra.more || []) probs.push(p);
    if (probs.length) bad.push(tag + ': ' + probs.join('; ')); else seen.push(screen);
   };
   for (const [screen, go] of Object.entries(APP)) {
    const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(s => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, seed);
    try {
     await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => typeof setView === 'function' && typeof DATA === 'object', null, {timeout: 20000}); await page.waitForTimeout(200);
     await go(page); const more = [];
     if (screen === 'dock') more.push(...await page.evaluate(() => { const bs = [...document.querySelectorAll('#modeButtons button')].filter(b => b.offsetParent).map(b => [b.textContent.trim().slice(0, 14), b.getBoundingClientRect()]), out = [];
      for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i][1], c = bs[j][1]; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) out.push('dock ' + bs[i][0] + ' overlaps ' + bs[j][0]) }
      if (!bs.length) out.push('no dock buttons'); return out }));
     if (screen === 'keyboard') more.push(...await page.evaluate(() => { const r = document.querySelector('.lexi-host').shadowRoot, vh = visualViewport.height, out = [];
      if (!r.querySelector('.lexi-keyboard') && !r.host.classList.contains('lexi-keyboard') && !r.querySelector('.lexi-app')?.closest('.lexi-keyboard')) out.push('keyboard layout not applied');
      for (const s of ['#draft', 'button.send']) { const e = r.querySelector(s), b = e && e.getBoundingClientRect(); if (!b || b.bottom > vh + 1 || b.top < 0) out.push(s + ' not visible above the keyboard (' + (b ? Math.round(b.top) + '–' + Math.round(b.bottom) : 'missing') + ' of ' + Math.round(vh) + ')') }
      const dw = r.querySelector('#draft')?.getBoundingClientRect().width || 0; if (dw < innerWidth * 0.45) out.push('input too narrow with the keyboard up (' + Math.round(dw) + ' of ' + innerWidth + ' px)');
      if (r.activeElement?.id !== 'draft') out.push('input lost focus'); return out }));
     if (screen === 'lessonHelp') more.push(...await page.evaluate(() => document.querySelector('.lexi-host')?.shadowRoot?.querySelector('.chat-log') ? [] : ['Lesson Help did not open']));
     await check(page, screen, errors, {more});
    } catch (e) { bad.push(screen + ' ' + ui + '@' + w + 'x' + h + ': ' + e.message.split('\n')[0]) }
    await page.close();
   }
   // LIFE: the story list and the first scene of a story (separate pages of the app)
   for (const [screen, url, ready] of [['lifeList', 'learn-life.html', 'main'], ['lifeScene', 'learn-life-story.html?s=first-day', '.ls-hero .ls-primary']]) {
    const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(s => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, seed);
    try {
     await page.goto(B.base + '/app/' + url); await page.waitForSelector(ready, {timeout: 15000}); await page.waitForTimeout(300);
     if (screen === 'lifeScene') { await page.click('.ls-hero .ls-primary'); await page.waitForSelector('.ls-stage .ls-stage-say', {timeout: 10000}); await page.waitForTimeout(300) }
     await check(page, screen, errors);
    } catch (e) { bad.push(screen + ' ' + ui + '@' + w + 'x' + h + ': ' + e.message.split('\n')[0]) }
    await page.close();
   }
   await ctx.close();
  }
 } finally { await br.close(); B.close?.() }
 if (bad.length) { console.log(bad.join('\n')); assert.fail(bad.length + ' of ' + n + ' screen states with a problem') }
 const by = {}; for (const s of seen) by[s] = (by[s] || 0) + 1;
 console.log('PASS: mobile 3.0 — ' + n + ' screen states (' + VIEWS.map(v => v.join('×')).join(', ') + ' × uk / en / ar): ' + Object.entries(by).map(([k, v]) => k + ' ' + v).join(', ') + '; no overflow, targets ≥ 44 px inside the viewport, no clipped text, RTL for Arabic, dock buttons apart, Lexi input above the keyboard');
})().catch(e => { console.error(e.message); process.exit(1) });
