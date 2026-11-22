// Release 264 · full mobile matrix (opt-in, heavy: FULL_MATRIX=1 node tests/v3/run.cjs mobile-matrix). 6 sizes (320×568,
// 360×800, 390×844, 412×915, 768×1024, 844×390) × uk / en / fr / ar × light / dark × 6 views (home, lesson, games, progress,
// dictionary, test) + every view at 360 px with text at 150 % (root font size; an approximation of Android text scaling,
// which also enlarges px text — not a replacement for a real phone). Checks: sideways scroll, elements past the edge
// (not inside a scroll / clip container), tap targets under 24 px, RTL direction for Arabic, page errors.
// Chromium emulation only: it is not a test on a real Samsung.
const assert = require('node:assert/strict');
if (process.env.FULL_MATRIX !== '1') { console.log('SKIP: opt-in (FULL_MATRIX=1), ~10 minutes'); process.exit(0) }
let browser; try { ({browser} = require('../tools/test-043/serve.cjs')); require.resolve('playwright') } catch (e) { console.log('SKIP: ' + e.message); process.exit(0) }
const fs = require('node:fs'), path = require('node:path'), {repo} = require('../tools/test-043/serve.cjs');
const rel = fs.readFileSync(path.join(repo, 'app/app.js'), 'utf8').match(/RELEASE_VERSION="(\d+)"/)[1];
const SIZES = [[320, 568], [360, 800], [390, 844], [412, 915], [768, 1024], [844, 390]], VIEWS = ['path', 'lesson', 'games', 'progress', 'dict', 'toets'];
(async () => {
 let B; try { B = await browser() } catch (e) { if (/Executable doesn't exist/.test(e.message)) { console.log('SKIP: ' + e.message); return } throw e }
 await B.b.close(); const {chromium} = require('playwright'), br = await chromium.launch(); const bad = []; let n = 0;
 const runs = [];
 for (const [w, h] of SIZES) for (const ui of ['uk', 'en', 'fr', 'ar']) for (const theme of ['light', 'dark']) runs.push({w, h, ui, theme, scale: 1});
 for (const ui of ['uk', 'en', 'fr', 'ar']) runs.push({w: 360, h: 800, ui, theme: 'light', scale: 1.5});
 try {
  for (const {w, h, ui, theme, scale} of runs) {
   const tag = `${w}×${h} ${ui} ${theme}${scale > 1 ? ' text150%' : ''}`;
   const ctx = await br.newContext({viewport: {width: w, height: h}, isMobile: w < 768, hasTouch: true, colorScheme: theme, serviceWorkers: 'block'});
   await ctx.route('**/*', r => r.request().url().startsWith(B.base) ? r.continue() : r.abort());
   const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
   await page.addInitScript(s => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, {leren_release_seen: JSON.stringify(rel), poly_ui: ui, poly_target: 'nl', poly_theme: theme, leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_tour_done: 'true', leren_level_asked: 'true'});
   await page.goto(B.base + '/app/index.html'); await page.waitForFunction(() => typeof setView === 'function', null, {timeout: 20000}); await page.waitForTimeout(300);
   if (scale > 1) await page.addStyleTag({content: 'html{font-size:150%!important}'});
   for (const v of VIEWS) {
    await page.evaluate(v => setView(v), v); await page.waitForTimeout(250); n++;
    const r = await page.evaluate(() => { const W = document.documentElement.clientWidth; scrollTo(-99999, 0); const a = scrollX; scrollTo(99999, 0); const b = scrollX; scrollTo(0, 0);
     const out = [], small = []; const clipped = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true; return false };
     for (const e of document.querySelectorAll('main *, header *')) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') continue; const q = e.getBoundingClientRect(); if (q.width && (q.left < -1 || q.right > W + 1) && !clipped(e)) out.push((e.id || e.className || e.tagName).toString().slice(0, 30) + ' ' + Math.round(q.left) + '..' + Math.round(q.right)) }
     for (const e of document.querySelectorAll('main button, main a[href], header button, header a[href], main [role=button]')) { const q = e.getBoundingClientRect(); if (!q.width || !e.offsetParent) continue; if (q.width < 24 || q.height < 24) small.push((e.id || e.className || e.textContent).toString().trim().slice(0, 24) + ' ' + Math.round(q.width) + '×' + Math.round(q.height)) }
     return {side: Math.max(document.documentElement.scrollWidth - W, Math.abs(a), Math.abs(b)), out: out.slice(0, 3), small: small.slice(0, 3), dir: document.documentElement.dir} });
    if (r.side > 1 || r.out.length) bad.push(`${tag} ${v}: sideways ${r.side}px ${r.out.join(', ')}`);
    if (r.small.length) bad.push(`${tag} ${v}: tap target < 24 px: ${r.small.join(', ')}`);
    if (ui === 'ar' && r.dir !== 'rtl') bad.push(`${tag} ${v}: Arabic not RTL`);
   }
   if (errors.length) bad.push(`${tag}: page errors ${errors.join(' / ').slice(0, 160)}`);
   await ctx.close();
  }
 } finally { await br.close(); B.close?.() }
 if (bad.length) { console.log(bad.join('\n')); assert.fail(bad.length + ' problem(s) in ' + n + ' view states') }
 console.log(`PASS: full mobile matrix — ${n} view states (6 sizes × 4 languages × light / dark × 6 views, + text 150 % at 360 px): no sideways scroll, nothing past the edge, tap targets ≥ 24 px, Arabic RTL, no page errors`);
})().catch(e => { console.error(e); process.exit(1) });
