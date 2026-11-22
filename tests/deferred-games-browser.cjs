// LerenBe 3.0 (PR #63): the word builder and «Kamer» games are loaded with `defer` (they are not on the first screen), which
// takes ≈ 41 KB gzip off the render-blocking first screen. Their titles are added to the games menu in start() (which runs
// on DOMContentLoaded, after every deferred script). Checks: the three scripts are deferred and in order, the game
// titles are there in uk / en / fr / ar, the tiles open the games, and no page error. Run: node tests/deferred-games-browser.cjs
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: Playwright is not installed'); process.exit(0) }
const root = path.join(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const T = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.webmanifest': 'application/json'};
// static: deferred, in their old order (art before the game that uses it), after app.js is still fine because start() waits
const tag = f => (html.match(new RegExp('<script src="\\./' + f.replace(/[./]/g, '\\$&') + '\\?v=\\d+"([^>]*)>')) || [])[1];
for (const f of ['modules/word-builder/art.js', 'modules/word-builder/game.js', 'modules/kamer/game.js']) assert.match(tag(f) || 'missing', /\bdefer\b/, f + ' is deferred');
assert(html.indexOf('word-builder/art.js') < html.indexOf('word-builder/game.js'), 'word art loads before the word builder');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.match(app, /function start\(\)\{\n gameTitles\(\);/, 'the game titles join the menu first thing in start()');
assert.doesNotMatch(app.slice(0, app.indexOf('function gameTitles(){')), /LerenKamer\.tr\(|LerenWordBuilder\.tr\(/, 'no top-level use of the deferred games before start()');
const server = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html';
 if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() } r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r) });
(async () => {
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port + '/index.html';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const release = app.match(/const RELEASE_VERSION="(\d+)"/)[1], seen = {};
 try {
  for (const ui of ['uk', 'en', 'fr', 'ar']) {
   const ctx = await browser.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'}), page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
   await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
   await page.addInitScript(([r, u]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('poly_ui', u); localStorage.setItem('poly_target', 'nl'); localStorage.setItem('leren_welcome_seen', 'true'); localStorage.setItem('leren_release_seen', JSON.stringify(r)) }, [release, ui]);
   await page.goto(base); await page.waitForFunction(() => window.learningPath && window.LerenKamer && window.LerenWordBuilder);
   const t = await page.evaluate(u => ({wb: G_UI[u].wb, kamer: G_UI[u].kamer, kamer1: G_UI[u].kamer1}), ui);
   for (const [k, v] of Object.entries(t)) assert.ok(typeof v === 'string' && v.trim().length > 2, ui + ': title of ' + k + ' (' + v + ')');
   seen[ui] = t.wb + ' / ' + t.kamer1 + ' / ' + t.kamer;
   for (const [lv, id] of [['a12', 'wb'], ['a11', 'kamer1'], ['a21', 'kamer']]) {
    const shown = await page.evaluate(([l, g]) => { curLevel = l; setView('games'); renderGamesHome(); const tile = document.querySelector('[data-game="' + g + '"]'); return tile ? tile.textContent : null }, [lv, id]);
    assert.ok(shown && shown.includes(t[id]), ui + ' ' + lv + ': the ' + id + ' tile shows its title');
   }
   await page.evaluate(() => { curLevel = 'a21'; setView('games'); renderGamesHome(); document.querySelector('[data-game="kamer"]').click() }); await page.waitForSelector('.k-menu', {timeout: 15000}); await page.click('.k-big'); await page.waitForSelector('.k-room', {timeout: 15000});
   await page.evaluate(() => { curLevel = 'a12'; setView('games'); renderGamesHome(); document.querySelector('[data-game="wb"]').click() }); await page.waitForFunction(() => gState && gState.wb, null, {timeout: 15000});
   assert.deepEqual(errors, [], ui + ': no page error'); await ctx.close();
  }
  console.log('PASS: deferred games — word builder and Kamer load with defer (≈ 41 KB off the first screen); titles in uk / en / fr / ar (' + Object.values(seen).join(' | ') + '); tiles show them and open the games');
 } finally { await browser.close(); server.close() }
})().catch(e => { console.error(e); process.exit(1) });
