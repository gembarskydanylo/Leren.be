// "Kamer van Pieter" (A2 game): the tile is only in A2, the 3D room renders, every task can be completed and graded.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/kamer-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium');server.close();return}
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
  await page.addInitScript(r=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();localStorage.setItem('poly_ui','uk');localStorage.setItem('leren_release_seen',JSON.stringify(r))},release);
  await page.goto(base);await page.waitForFunction(()=>window.learningPath);
  // A1.1 has no Kamer tile, A2 has one
  const tile=lv=>page.evaluate(l=>{curLevel=l;setView('games');renderGamesHome();return !!document.querySelector('[data-game="kamer"]')},lv);
  assert.equal(await tile('a11'),false,'no Kamer tile in A1.1');assert.equal(await tile('a12'),false,'no Kamer tile in A1.2');assert.equal(await tile('a21'),true,'Kamer tile in A2');
  await page.click('[data-game="kamer"]');await page.waitForSelector('.k-menu');
  assert.equal(await page.locator('.k-task').count(),5,'five tasks');
  // explore: the room has 18 objects and tapping shows article + noun + translation
  await page.click('.k-big');await page.waitForSelector('.k-room');
  assert.equal(await page.locator('.k-room [data-item]').count(),18,'18 objects');
  const preserved=await page.evaluate(()=>['.k-room','.k-obj','.k-box'].every(s=>getComputedStyle(document.querySelector(s)).transformStyle==='preserve-3d')&&getComputedStyle(document.querySelector('.k-scene')).perspective!=='none');
  assert(preserved,'preserve-3d and perspective are set');
  await page.evaluate(()=>document.querySelector('[data-item="kast"]').click());
  assert.match(await page.locator('.k-word-nl').textContent(),/de kast/);assert.match(await page.locator('.k-word-tr').textContent(),/шафа/);
  await page.click('.k-rot >> nth=1');assert.notEqual(await page.evaluate(()=>document.querySelector('.k-room').style.getPropertyValue('--ry')),'-24deg','rotate button turns the room');
  // task 1: wrong object, then the bottle, then a full answer = 3 stars
  const say=async v=>{await page.fill('.k-input',v);await page.click('.k-form button[type=submit]')};
  await page.click('.k-back-btn');await page.click('.k-task >> nth=0');
  await page.evaluate(()=>document.querySelector('[data-item="bed"]').click());assert(await page.locator('.k-msg2').count(),'not a drink hint');
  await page.evaluate(()=>document.querySelector('[data-item="fles"]').click());await say('Dit is een fles water. Ik heb dorst.');
  await page.waitForSelector('.k-bigstars');assert.equal((await page.locator('.k-bigstars').textContent()),'★★★');
  // task 2: weak answer is refused, then 3 of 4 objects = 2 stars
  await page.click('.k-task-next, .btn.primary >> nth=0').catch(()=>{});
  await page.waitForSelector('.k-input');await say('tafel');assert.match(await page.locator('.k-msg').textContent(),/Спробуй/);
  await say('Op de tafel liggen boeken, een kopje en een lamp.');await page.waitForSelector('.k-bigstars');assert.equal(await page.locator('.k-bigstars').textContent(),'★★☆');
  // task 3: wrong place counts, right places finish, omdat = 3 stars (minus nothing: only one miss)
  await page.click('.k-result .btn.primary');await page.waitForSelector('.k-scene');
  const click=id=>page.evaluate(i=>document.querySelector('[data-item="'+i+'"]').click(),id);
  await click('trui');await click('stoel');assert(await page.locator('.k-hintnl').count(),'wrong place explains in Dutch');
  await click('trui');await click('kast');await click('rugzak');await click('stoel');await click('fles');await click('koelkast');
  await page.waitForSelector('.k-input');await say('Ik leg de trui in de kast omdat het daar netjes is.');await page.waitForSelector('.k-bigstars');assert.equal(await page.locator('.k-bigstars').textContent(),'★★★');
  // task 4: needs perfectum
  await page.click('.k-result .btn.primary');await page.waitForSelector('.k-scene');await click('lamp');await page.waitForSelector('.k-input');
  await say('ik ben moe');assert.match(await page.locator('.k-msg').textContent(),/Спробуй/);await say('Gisteren heb ik de lamp gebruikt.');await page.waitForSelector('.k-bigstars');assert.equal(await page.locator('.k-bigstars').textContent(),'★★★');
  // task 5: wardrobe -> outfit -> plan with "ga ik"
  await page.click('.k-result .btn.primary');await page.waitForSelector('.k-scene');await click('kast');await page.click('.k-outfit >> nth=0');
  await say('Morgen ga ik met mijn jas naar school.');await page.waitForSelector('.k-bigstars');assert.equal(await page.locator('.k-bigstars').textContent(),'★★★');
  // stars are saved
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_kamer_v1')).stars);assert.deepEqual(saved,{t1:3,t2:2,t3:3,t4:3,t5:3});
  assert.deepEqual(errors,[],'no page errors');
  console.log('PASS: Kamer van Pieter: A2-only tile, 3D room with 18 objects, rotate/tap, five tasks graded and saved');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
