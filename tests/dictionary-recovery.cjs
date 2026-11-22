// LRN-001 · dictionary recovery after a failed download, tested on the code the app really runs (app.js; tools/dict-ui.js is an
// older copy). 1) loader in a VM: fallback, bounded exponential backoff with jitter, one request at a time, forced retry,
// broken files, recovery, the online event; 2) browser: dict/nl.json fails → the lesson words with a «Try again» button
// (uk / en / fr / ar); reopening after the backoff or «Try again» brings the full dictionary; no request storm.
// Run: node tests/dictionary-recovery.cjs
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const start = source.indexOf('const DICT={'), end = source.indexOf('function dictCorpus()', start);
assert(start >= 0 && end > start, 'Dictionary loading implementation must be present in app.js');
const loader = source.slice(start, end);
const listeners = {};
let now = 100000, calls = 0, mode = 'fail', renders = 0, gate = null;
const entries = [{w: 'fiets', p: 'n', uk: 'велосипед'}];
const ctx = vm.createContext({
 Date: {now: () => now}, Promise, Error, Array, Map, String, Math,
 window: {addEventListener: (name, fn) => { listeners[name] = fn }},
 DX: {build: list => ({entries: list})},
 allVocab: () => [],
 fetch: async () => {
  calls++; if (gate) await gate;
  if (mode === 'fail') throw Error('offline');
  if (mode === '500') return {ok: false, status: 500, json: async () => ({})};
  if (mode === 'html') return {ok: true, json: async () => { throw new SyntaxError('Unexpected token <') }};
  if (mode === 'empty') return {ok: true, json: async () => []};
  return {ok: true, json: async () => entries.map(e => ({...e}))};
 },
 runSearch: () => { renders++ }
});
vm.runInContext(loader, ctx);
const state = vm.runInContext('DICT', ctx), load = a => vm.runInContext(a ? 'dictLoad(true)' : 'dictLoad()', ctx);
const wait = () => state.retryAt - now;
(async () => {
 const fallback = await load();
 assert.equal(state.offline, true, 'failure should enter fallback mode'); assert.equal(fallback.entries.length, 0, 'fallback stays usable'); assert.equal(calls, 1);
 assert.ok(wait() >= 3750 && wait() <= 6250, 'first retry after ≈5 s ± 25 % (got ' + wait() + ')');
 await load(); assert.equal(calls, 1, 'no new request during the backoff');
 // backoff grows and is capped; jitter keeps it inside ±25 %
 const waits = [];
 for (let i = 0; i < 9; i++) { now = state.retryAt; await load(); waits.push(wait()) }
 assert.ok(waits[0] >= 7500 && waits[0] <= 12500, 'second wait ≈10 s (' + waits[0] + ')');
 assert.ok(waits[1] > waits[0] * 1.2, 'the backoff grows');
 assert.ok(waits.every(w => w <= 375000), 'the backoff is capped at 5 min + jitter (' + Math.max(...waits) + ')');
 assert.equal(calls, 10, 'one request per backoff window');
 // a forced retry ignores the backoff; parallel calls share one request
 gate = new Promise(r => setTimeout(r, 30)); const c0 = calls; const [a, b, c] = [load(true), load(true), load()]; await Promise.all([a, b, c]); gate = null;
 assert.equal(calls, c0 + 1, 'parallel loads make a single request');
 // broken answers count as failures, never as the full dictionary
 for (const m of ['500', 'html', 'empty']) { mode = m; await load(true); assert.equal(state.offline, true, m + ' keeps the fallback'); assert.equal(state.ix.entries.length, 0) }
 // recovery
 mode = 'ok'; now = state.retryAt;
 const recovered = await load();
 assert.equal(recovered.entries.length, 1, 'full dictionary replaces the fallback'); assert.equal(state.offline, false); assert.equal(state.retryAt, 0); assert.equal(state.fails, 0, 'backoff reset after success');
 const c1 = calls; await load(); await load(true); assert.equal(calls, c1, 'a loaded dictionary is never fetched again');
 // a separate offline session recovers at once when the browser goes online
 vm.runInContext('DICT.ix=null;DICT.offline=false', ctx); mode = 'fail'; await load(); assert.equal(state.offline, true);
 mode = 'ok'; listeners.online(); await new Promise(r => setTimeout(r, 10));
 assert.equal(state.offline, false, 'online event restores the full dictionary'); assert.equal(state.ix.entries.length, 1); assert.ok(renders >= 1, 'online recovery refreshes the results');
 console.log('PASS: dictionary loader (app.js) — fallback, backoff 5 s → 5 min with ±25 % jitter, one request per window, parallel loads share one request, forced retry, 500 / HTML / empty file stay fallback, recovery resets the backoff, online event');
 await browserPart();
})().catch(e => { console.error(e); process.exitCode = 1 });

async function browserPart() {
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: browser part (Playwright is not installed)'); return }
 const T = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.m4a': 'audio/mp4'};
 let dictMode = 'fail', dictHits = 0;
 const server = http.createServer((q, r) => { const u = new URL(q.url, 'http://x');
  if (u.pathname === '/dict/nl.json') { dictHits++; if (dictMode === 'fail') { r.statusCode = 503; return r.end('busy') } }
  let f = path.join(root, decodeURIComponent(u.pathname)); if (f.endsWith(path.sep)) f += 'index.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() }
  r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port + '/index.html';
 let br; try { br = await chromium.launch() } catch { console.log('SKIP: browser part (no Chromium)'); server.close(); return }
 const RETRY = {uk: 'Спробувати ще раз', en: 'Try again', fr: 'Réessayer', ar: 'حاول مرة أخرى'}, OFF = {uk: /без інтернету/, en: /internet connection/, fr: /besoin d’Internet/, ar: /الإنترنت/};
 try {
  for (const ui of ['uk', 'en', 'fr', 'ar']) {
   dictMode = 'fail'; dictHits = 0;
   const ctx = await br.newContext({viewport: {width: 360, height: 760}, serviceWorkers: 'block'}); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
   const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
   const rel = source.match(/RELEASE_VERSION="(\d+)"/)[1];
   await page.addInitScript(([ui, rel]) => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1'); localStorage.clear(); for (const [k, v] of Object.entries({poly_ui: ui, poly_target: 'nl', leren_release_seen: JSON.stringify(rel), leren_welcome_seen: 'true', leren_onboarding_language_v1: '1', leren_start_known_v1: 'zero', leren_tour_done: 'true', leren_level_asked: 'true'})) localStorage.setItem(k, v) }, [ui, rel]);
   await page.goto(base); await page.waitForFunction(() => typeof setView === 'function' && typeof runSearch === 'function');
   await page.evaluate(() => setView('dict')); await page.waitForFunction(() => document.querySelector('#searchResults .dx-offline .dx-retry:not([disabled])'), null, {timeout: 15000});
   const s1 = await page.evaluate(() => ({text: document.querySelector('.dx-offline').textContent, btn: document.querySelector('.dx-retry').textContent, h: document.querySelector('.dx-retry').getBoundingClientRect().height, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth}));
   assert.match(s1.text, OFF[ui], ui + ': offline note in the interface language'); assert.equal(s1.btn, RETRY[ui], ui + ': «Try again» label'); assert.ok(s1.h >= 44, ui + ': button ≥ 44 px'); assert.ok(s1.scroll <= 1, ui + ': no sideways scroll');
   // typing during the backoff does not make new requests
   const h0 = dictHits; for (const ch of 'fiets') await page.type('#searchInput', ch); await page.waitForTimeout(300); assert.equal(dictHits, h0, ui + ': no request storm while typing');
   dictMode = 'ok';
   if (ui === 'uk') await page.evaluate(() => { setView('path'); DICT.retryAt = Date.now() - 1; setView('dict') }); // reopening after the backoff
   else await page.click('.dx-retry');
   await page.waitForFunction(() => !DICT.offline && !document.querySelector('.dx-offline'), null, {timeout: 15000});
   const full = await page.evaluate(() => DICT.ix.entries.length); assert.ok(full > 1000, ui + ': the full dictionary is loaded (' + full + ' entries)');
   assert.deepEqual(errors, [], ui + ': page errors'); await ctx.close();
  }
  console.log('PASS: dictionary in the browser — failed download shows the lesson words with «Try again» (uk/en/fr/ar, 44 px, 360 px); no requests while typing; reopening after the backoff (uk) or «Try again» (en/fr/ar) loads the full dictionary');
 } finally { await br.close(); server.close() }
}
