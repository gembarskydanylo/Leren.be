// TEST-022 · A calm home for beginners (app/): until three lessons are done the long showcase (games gallery, clock,
// characters, reviews, FAQ, topic preview) is folded into one short «Ще в LerenBe» block — games, AI chat, clock and
// topics stay one tap away, «Показати все на головній» brings everything back (remembered), and after the third
// lesson the full home appears by itself. Duplicates are gone: no second «Почати навчання» and no LIFE button in the
// HERO, no old «Learn Life» block next to the LIFE card. Every tap target on the home is at least 44 px high.
// Browser: Playwright Chromium, emulated 360/390/430/1280/1440 — not a physical phone. SHOTS=<dir> saves screenshots.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const repo = path.join(__dirname, '..'), root = path.join(repo, 'app');
(async () => {
 const lp = fs.readFileSync(path.join(root, 'modules/learning-path/ui.js'), 'utf8');
 assert(/leren_home_all_v1/.test(lp) && /doneLessons<3/.test(lp), 'simple home rule');
 for (const l of ['uk', 'en', 'fr', 'ar']) assert(new RegExp(l + ":\\{title:'[^']+',hint:").test(lp), '«More» texts in ' + l);
 console.log('PASS: TEST-022 static — simple-home rule and texts in 4 languages');
 let chromium; try { ({chromium} = require('playwright')) } catch { console.log('SKIP: browser part (Playwright is not installed)'); return }
 const T = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json'};
 const server = http.createServer((q, r) => { let f = path.join(repo, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (f.endsWith(path.sep)) f += 'index.html'; if (!f.startsWith(repo) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() } r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r) });
 await new Promise(r => server.listen(0, '127.0.0.1', r)); const B = 'http://127.0.0.1:' + server.address().port + '/app/';
 let browser; try { browser = await chromium.launch() } catch { console.log('SKIP: no Chromium'); server.close(); return }
 const report = [], external = [], shot = async (page, name, full = false) => { if (process.env.SHOTS) await page.screenshot({path: path.join(process.env.SHOTS, 'simple-home-' + name + '.png'), fullPage: full}) };
 // TEST-050: the calm home is now «Сьогодні з Lexi»: a short page with ONE main action; everything that used to be folded into
 // «Ще в LerenBe» is one tap away through the bottom bar (Навчання / Lexi / Ігри / Ще) and the «Ще» sheet. «Я вчу» lives in «Навчання».
 async function open(w, h) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, serviceWorkers: 'block'}), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('request', q => { if (!q.url().startsWith('http://127.0.0.1')) external.push(q.url()) }); await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto(B); await page.waitForSelector('dialog.td-onb [data-action=skip]'); await page.click('dialog.td-onb [data-action=skip]');
  await page.waitForFunction(() => window.learningPath && !document.querySelector('dialog[open]')); await page.waitForTimeout(300); await page.evaluate(() => openToday()); await page.waitForSelector('.td-home'); await page.waitForTimeout(300);
  return {ctx, page, errors};
 }
 const home = page => page.evaluate(() => { const lp = document.querySelector('#learningPath'), r = e => e.getBoundingClientRect();
  const small = [...lp.querySelectorAll('button, a')].filter(e => { const b = r(e); return b.width && b.height && (b.height < 44 || b.width < 44) }).map(e => e.textContent.trim().slice(0, 22) + ' ' + Math.round(r(e).width) + '×' + Math.round(r(e).height));
  const primary = [...lp.querySelectorAll('.td-primary, .fh-primary')].filter(e => e.offsetParent);
  return {primary: primary.length, primaryBottom: primary[0] ? r(primary[0]).bottom : 1e9, lifeLinks: [...lp.querySelectorAll('a[href*="learn-life"]')].length, oldShowcase: !!lp.querySelector('.hs-intro, .hs-features, .fh-overview, .hv-hero'),
   height: document.documentElement.scrollHeight, hscroll: document.documentElement.scrollWidth > innerWidth, small} });
 const step = m => process.env.DBG && console.log('step', m);
 const tab = async (page, id) => { step('tab '+id); await page.click(`#modeButtons [data-tab="${id}"]`); await page.waitForTimeout(150) };
 const moreItem = async (page, id) => { step('more '+id); await tab(page, 'more'); await page.waitForSelector('dialog.td-more'); await page.click(`dialog.td-more [data-more="${id}"]`); await page.waitForTimeout(200) };
 try {
  for (const [w, h] of [[360, 780], [390, 844], [430, 932], [1280, 800], [1440, 900]]) {
   const {ctx, page, errors} = await open(w, h);
   const s = await home(page);
   assert.equal(s.primary, 1, w + ': one main button'); assert(s.primaryBottom <= h, w + ': the main button is on the first screen (' + Math.round(s.primaryBottom) + ')');
   assert(!s.oldShowcase, w + ': no long showcase on the home'); assert.equal(s.lifeLinks, 0, w + ': no LIFE link on the home (LIFE is one tap away in «Ще»)');
   assert(!s.hscroll, w + ': no horizontal scroll'); assert.deepEqual(s.small, [], w + ': tap targets ≥ 44 px'); assert(s.height <= 2.6 * h, w + ': the home is short (' + s.height + 'px)');
   assert.deepEqual(await page.$$eval('#modeButtons [data-tab]', x => x.map(e => e.dataset.tab)), ['today', 'learn', 'lexi', 'games', 'more'], w + ': bottom bar');
   await shot(page, w + '-today', true);
   // «Я вчу» — one button at the top of «Навчання»: every language and the Dutch levels; picking a level changes the label
   await tab(page, 'learn'); await page.waitForSelector('#learningPath .hv-pick-btn');
   assert.match(await page.locator('.hv-pick-btn').textContent(), /Я вчу.*Нідерландська · Починаю з нуля/); assert.equal(await page.getAttribute('.hv-pick-btn', 'aria-expanded'), 'false'); assert.equal(await page.locator('.hv-pick-panel').isVisible(), false);
   await page.click('.hv-pick-btn'); assert.equal(await page.getAttribute('.hv-pick-btn', 'aria-expanded'), 'true'); assert.deepEqual(await page.$$eval('.hv-pick-panel .hv-course', x => x.map(e => e.dataset.course)), ['nl', 'en', 'fr'], 'TEST-050: Dutch, English, French');
   assert.deepEqual(await page.$$eval('.hv-pick-panel .hv-level-name', x => x.map(e => e.textContent)), ['Починаю з нуля', 'Вивчаю основи', 'Спілкуюся в повсякденних ситуаціях']); assert(await page.locator('.hv-pick-panel .hv-cefr').count(), 'CEFR note');
   assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.hv-pick button')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height < 44 }).length), 0, w + ': picker targets ≥ 44 px'); await shot(page, w + '-picker-open');
   await page.click('.hv-pick-panel .hv-level[data-level="A1.2"]'); await page.waitForFunction(() => /Вивчаю основи/.test(document.querySelector('.hv-pick-btn')?.textContent || '')); assert.equal(await page.evaluate(() => localStorage.getItem('poly_level')), 'a12'); assert.equal(await page.locator('.hv-pick-panel').isVisible(), false, 'closes after the choice');
   await page.click('.hv-pick-btn'); await page.click('.hv-pick-panel .hv-level[data-level="A1.1"]'); await page.waitForFunction(() => /Починаю з нуля/.test(document.querySelector('.hv-pick-btn')?.textContent || ''));
   // English opens from the picker (the Course Player); the Dutch route stays
   await page.click('.hv-pick-btn'); await page.click('.hv-pick-panel .hv-course[data-course="en"] button'); await page.waitForSelector('.cp-stage'); await page.click('.cp-stage .cp-close'); await page.waitForTimeout(200);
   await page.evaluate(() => { localStorage.setItem('leren_learn_lang', 'nl') }); await page.goto(B); await page.waitForSelector('.td-home');
   // everything is one tap away
   await tab(page, 'learn'); await page.waitForSelector('#learningPath .fh-topic'); await page.locator('#learningPath .fh-topic').first().click(); await page.waitForFunction(() => document.querySelector('#learningPath').dataset.screen === 'map' && !!document.querySelector('.fh-lesson-row'));
   await tab(page, 'games'); await page.waitForFunction(() => view === 'games');
   await tab(page, 'lexi'); await page.waitForFunction(() => !!document.querySelector('.ai-consent, .ai-chat, .g-chat, .lexi-off, .ai-chat-card, .lexi-host')); // AI chat (consent first, or Lexi's «off» card)
   await page.keyboard.press('Escape'); await page.evaluate(() => typeof lexiClose === 'function' && lexiClose()); await page.evaluate(() => openToday());
   await moreItem(page, 'clock'); await page.waitForFunction(() => view === 'lesson' && tab === 'clock');
   await moreItem(page, 'dict'); await page.waitForFunction(() => view === 'dict');
   await moreItem(page, 'progress'); await page.waitForFunction(() => view === 'progress');
   await tab(page, 'more'); assert.equal(await page.locator('dialog.td-more [data-more="life"]').count(), 1, w + ': one LIFE entrance'); assert.equal(await page.locator('dialog.td-more [data-more="settings"]').count(), 1); await page.keyboard.press('Escape');
   // progress: after three lessons the home stays short and the main button still opens a lesson; XP untouched
   const xp = await page.evaluate(() => localStorage.getItem('poly_score'));
   await page.evaluate(() => { const m = learningPath.model, ids = LerenLearningPath.catalog(DATA, LerenCurriculum).lessons.slice(0, 3).map(l => l.id); if (!m.state.started) m.start(); for (const id of ids) m.state.completed[id] = 1; m.state.session = null; m.save(); openToday() });
   await page.waitForSelector('.td-home'); const g = await home(page); assert.equal(g.primary, 1); assert(g.height <= 2.6 * h, w + ': still short after 3 lessons');
   await shot(page, w + '-after-3-lessons', true);
   await page.click('.td-start');
   // today's only lesson is among the three finished ones: the session shows its summary (never a silent home), «Продовжити навчання» → a new lesson
   await page.waitForFunction(() => ['lesson', 'intro', 'talk'].includes(document.querySelector('#learningPath').dataset.screen) || document.querySelector('#learningPath .td-result'));
   if (await page.locator('#learningPath .td-result').count()) await page.click('#learningPath .td-result [data-action=more]');
   await page.waitForFunction(() => ['lesson', 'intro', 'talk'].includes(document.querySelector('#learningPath').dataset.screen)); // the main button continues today's session (a lesson or its conversation) // the main button opens a lesson
   assert.equal(await page.evaluate(() => localStorage.getItem('poly_score')), xp, 'XP untouched by the home');
   assert.deepEqual(errors, []); await ctx.close(); report.push(w + ' px (home ' + s.height + 'px)');
  }
  assert.deepEqual(external.filter(u => !u.startsWith('https://static.cloudflareinsights.com/')), [], 'no request leaves the test site'); // LerenBe 3.0 integration: production analytics beacon (blocked)
  console.log('PASS: TEST-022/TEST-050 browser (emulated) — calm «Сьогодні», one main button, everything one tap away: ' + report.join(', '));
 } finally { await browser.close(); server.close() }
})().catch(e => { console.error(e); process.exit(1) });
