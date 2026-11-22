// LerenBe 3.0 quality audit · no horizontal overflow on phones. Found: the Arabic (RTL) dictionary at 320–360 px was up to 47 px
// wider than the screen (its filter chips gave .dict-view an 18 px larger minimum width), so the whole page shifted and the
// title and text were cut off. Every main view × 320 / 360 / 390 px × uk / ar × light / dark: the page cannot be scrolled sideways
// and no element sticks out of the screen. Chromium emulation, not a physical phone.
const assert = require('node:assert/strict');
let browser; try { ({browser} = require('../tools/test-043/serve.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const fs = require('node:fs'), path = require('node:path'), {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
(async () => {
 let B; try { B = await browser() } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 await B.b.close(); const {chromium} = require('playwright'), br = await chromium.launch(); const bad = []; let n = 0;
 try {
  for (const w of [320, 360, 390]) for (const ui of ['uk', 'ar']) for (const theme of ['light', 'dark']) {
   const ctx = await br.newContext({viewport: {width: w, height: 740}, isMobile: true, hasTouch: true, colorScheme: theme, serviceWorkers: 'block'});
   await ctx.route('**/*', r => r.request().url().startsWith(B.base) ? r.continue() : r.abort());
   const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
   await page.addInitScript(s => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, {leren_release_seen: JSON.stringify(rel), poly_ui: ui, poly_target: 'nl', poly_theme: theme, leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_tour_done: 'true', leren_level_asked: 'true'});
   await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => typeof setView === 'function', null, {timeout: 20000}); await page.waitForTimeout(300);
   for (const v of ['path', 'lesson', 'games', 'progress', 'dict', 'toets']) {
    await page.evaluate(v => setView(v), v); await page.waitForTimeout(250); n++;
    const r = await page.evaluate(() => { const W = document.documentElement.clientWidth; scrollTo(-99999, 0); const a = scrollX; scrollTo(99999, 0); const b = scrollX; scrollTo(0, 0);
     const out = []; const clipped = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true; return false };
     for (const e of document.querySelectorAll('main *, header *')) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') continue; const q = e.getBoundingClientRect(); if (q.width && (q.left < -1 || q.right > W + 1) && !clipped(e)) out.push((e.id || e.className || e.tagName).toString().slice(0, 30) + ' ' + Math.round(q.left) + '..' + Math.round(q.right)) }
     return {side: Math.max(document.documentElement.scrollWidth - W, Math.abs(a), Math.abs(b)), out: out.slice(0, 3)} });
    if (r.side > 1 || r.out.length) bad.push(`${w}px ${ui} ${theme} ${v}: sideways scroll ${r.side}px ${r.out.join(', ')}`);
   }
   if (errors.length) bad.push(`${w}px ${ui} ${theme}: page errors ${errors.join(' / ').slice(0, 160)}`);
   await ctx.close();
  }
 } finally { await br.close(); B.close?.() }
 if (bad.length) { console.log(bad.join('\n')); assert.fail(bad.length + ' problem(s)') }
 console.log(`PASS: no sideways scroll or element outside the screen — ${n} view states (home, lesson, games, progress, dictionary, test × 320 / 360 / 390 px × uk / ar × light / dark)`);
})().catch(e => { console.error(e.message); process.exit(1) });
