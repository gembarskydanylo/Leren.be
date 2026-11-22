// Reviews page (production since release 263 was the beta snapshot: «Test version», a «Write a review ↓» button to a hidden
// form, «Reviews are not shown in the test version», listed in the sitemap). Until reviews return with moderation the
// page is an honest note in uk / en / fr / ar: nothing suggests reviews are collected, no dead button, no public data
// collection, noindex and not in the sitemap. Run: node tests/reviews-honest.cjs
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('reviews.html'), i18n = read('reviews-i18n.js');
const TEST = /Тестов|тестов|test version|Test version|version de test|version test|النسخة التجريبية|تجريبي/;
assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ''), TEST, 'reviews.html calls itself a test version');
assert.doesNotMatch(i18n.replace(/\/\/.*$/gm, ''), TEST, 'reviews-i18n.js calls the page a test version');
assert.ok(!html.includes('href="#write"'), 'no button to the hidden review form');
assert.ok(!/reviews\.js/.test(html), 'the live Firebase script is not loaded (no data collection)');
// the page and its texts are in the Service Worker cache: the changed texts need a new ?v= in both places, or phones keep the old page
const {execSync} = require('node:child_process'), sw = read('sw.js'), ver = (t, f) => (t.match(new RegExp(f.replace('.', '\\.') + '\\?v=([\\w.-]+)')) || [])[1];
assert.ok(ver(html, 'reviews-i18n.js'), 'reviews.html loads reviews-i18n.js with a version');
assert.equal(ver(sw, 'reviews-i18n.js'), ver(html, 'reviews-i18n.js'), 'sw.js caches reviews-i18n.js at the version reviews.html loads');
let prod = null; try { prod = execSync(`git -C "${root}" show origin/main:reviews-i18n.js`, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}) } catch {}
if (prod && prod !== i18n) { const old = ver(execSync(`git -C "${root}" show origin/main:reviews.html`, {encoding: 'utf8'}), 'reviews-i18n.js'); assert.notEqual(ver(html, 'reviews-i18n.js'), old, 'reviews-i18n.js changed since production, so its ?v= must change too (was ' + old + ')') }
assert.match(html, /<meta name="robots" content="noindex">/, 'the temporary page is noindex');
assert.ok(!read('sitemap.xml').includes('reviews.html'), 'the temporary page is not in the sitemap');
(async () => {
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('PASS (static); SKIP browser: Playwright not installed'); return }
 const T = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2'};
 const server = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() } r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port + '/reviews.html';
 const br = await chromium.launch(); const NOTE = {uk: /оновлюємо/, en: /updating/, fr: /mettons à jour/, ar: /بتحديث/};
 try {
  for (const lang of ['uk', 'en', 'fr', 'ar']) {
   const ctx = await br.newContext({viewport: {width: 360, height: 800}}); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
   const page = await ctx.newPage(), errors = [], out = []; page.on('pageerror', e => errors.push(e.message)); page.on('request', q => { if (!q.url().startsWith('http://127.0.0.1')) out.push(q.url()) });
   await page.addInitScript(l => localStorage.setItem('poly_ui', l), lang); await page.goto(base + '?lang=' + lang); await page.waitForTimeout(300);
   const s = await page.evaluate(() => ({text: document.body.innerText, form: !!document.getElementById('reviewForm')?.offsetParent, submit: !!document.getElementById('submitReview')?.offsetParent, dir: document.documentElement.dir, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth}));
   assert.doesNotMatch(s.text, TEST, lang + ': visible text calls the page a test version');
   assert.match(s.text, NOTE[lang], lang + ': the honest note in the interface language');
   assert.ok(!s.form && !s.submit, lang + ': no review form or submit button is visible');
   if (lang === 'ar') assert.equal(s.dir, 'rtl'); assert.ok(s.scroll <= 1, lang + ': no sideways scroll');
   assert.deepEqual(errors, [], lang + ': page errors'); assert.deepEqual(out, [], lang + ': no request outside the site');
   await ctx.close();
  }
 } finally { await br.close(); server.close() }
 console.log('PASS: reviews page is an honest temporary note in uk/en/fr/ar (no «test version», no dead «Write a review» button, no visible form, no outside request), noindex, not in the sitemap');
})().catch(e => { console.error(e); process.exitCode = 1 });
