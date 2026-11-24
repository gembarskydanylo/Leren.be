// TEST-016 · New home page in app/ (snapshot of production Leren.be main 34add48 + modules/home-v2).
// Static: the snapshot is cut off from Firebase / Google sign-in / AI worker / analytics by its CSP; the home module is
// hooked into the existing learning-path home; home-visuals.json is valid (approved files exist with their real size,
// missing ones are not requested); the Codex art backlog is complete.
// Browser (Playwright Chromium, emulated widths 360 / 390 / 430 / 1280 / 1440, with the delivered HERO files (TEST-017)
// and with the HERO marked missing in a test-only copy of the manifest — the CSS fallback): HERO and text, no horizontal scroll, no layout shift,
// no request leaves the test site, no 404 for missing art; interface language switch; Dutch level cards; English course
// player with recorded audio; LIFE story with recorded voices; progress, XP and rewards; continue → lesson.
// Run: node tests/home-v2.cjs (the browser part is skipped without Playwright).
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const repo=path.join(__dirname,'..'),root=path.join(repo,'app'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
// image size from the file header (WebP VP8/VP8L/VP8X, PNG) — no extra tools
function size(file){const b=fs.readFileSync(file);
 if(b.toString('ascii',0,4)==='\x89PNG'.slice(0,4)||b[0]===0x89)return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};
 const t=b.toString('ascii',12,16);if(t==='VP8X')return {w:1+b.readUIntLE(24,3),h:1+b.readUIntLE(27,3)};
 if(t==='VP8 ')return {w:b.readUInt16LE(26)&0x3fff,h:b.readUInt16LE(28)&0x3fff};
 if(t==='VP8L'){const n=b.readUInt32LE(21);return {w:(n&0x3fff)+1,h:((n>>14)&0x3fff)+1}}return null}
(async()=>{
 // ---- static
 const html=read('index.html'),csp=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
 // LerenBe 3.0 integration: this is the production page — production CSP (Firebase, the AI Worker, Cloudflare analytics),
 // analytics on, indexed. The CSP must still forbid everything else.
 assert.match(csp,/default-src 'self'/);assert.match(csp,/object-src 'none'/);assert(!/unsafe-eval/.test(csp),'no unsafe-eval');
 assert(/static\.cloudflareinsights\.com\/beacon/.test(html),'production analytics kept');assert(!/noindex/.test(html),'production home is indexed');
 // LerenBe 3.0 integration: home-v2/ui.js is release 263 (263.1: single-course picker layout) (production course rule, aria-pressed)
 assert(html.includes('./modules/home-v2/ui.js?v=263.1')&&html.includes('./modules/home-v2/style.css?v=6'));
 const lp=read('modules/learning-path/ui.js');assert(lp.includes('globalThis.LerenHomeV2?.top?.(')&&lp.includes('if(!homeTop)courseSwitch')&&lp.includes('!placing&&!homeTop'),'hooked into the existing home, old duplicates hidden');
 const sw=read('sw.js');for(const f of ['./modules/home-v2/ui.js?v=263.1','./modules/home-v2/style.css?v=6','./img/home/hero-cat-v196-320.webp','./img/home/home-visuals.json','./modules/learning-path/ui.js?v=273'])assert(sw.includes('"'+f+'"'),'offline: '+f);
 assert.equal(sw.match(/leren-be-v(\d+)/)[1],read('app.js').match(/RELEASE_VERSION="(\d+)"/)[1],'cache name matches the release (update check)');
 const ui=read('modules/home-v2/ui.js');assert(!/localStorage\.setItem|leren_path_v1|poly_score\s*=/.test(ui),'home v2 writes no progress');assert(!/fetch\((?!'img\/home\/home-visuals\.json')/.test(ui),'only fetches its own manifest');
 const V=JSON.parse(read('img/home/home-visuals.json')),entries=[];
 for(const [k,e] of Object.entries(V)){if(!e||typeof e!=='object')continue;if(e.src)entries.push([k,e]);for(const v of ['desktop','mobile'])if(e[v])entries.push([k+'.'+v,e[v]]);if(e.desktop||e.mobile||e.src)assert(e.alt,k+': alt text')}
 for(const [k,e] of entries){assert(/^img\/[a-z0-9][a-z0-9/_.-]*\.(webp|avif|png|jpe?g)$/i.test(e.src),k+': path');assert(Number.isInteger(e.width)&&Number.isInteger(e.height),k+': intrinsic size');
  const f=path.join(root,e.src);if(e.status==='approved'){assert(fs.existsSync(f),k+': approved file exists');const s=size(f);assert.deepEqual(s,{w:e.width,h:e.height},k+': declared size = real size')}
  else assert.equal(e.status,'missing',k+': status')}
 assert.equal(V.mascot.status,'approved');
 // TEST-017: final HERO art is delivered — exact sizes, weight limits
 assert.equal(V.hero.status,'approved');for(const [v,w,h,max] of [['desktop',1920,1080,350000],['mobile',1280,800,220000]]){const e=V.hero[v];assert.equal(e.status,'approved');assert.deepEqual([e.width,e.height],[w,h],'hero '+v+' size');assert(fs.statSync(path.join(root,e.src)).size<=max,'hero '+v+' weight')}
 assert(!/home-hero-(desktop|mobile)\.webp/.test(sw),'HERO is cached on first view, not precached for everyone');
 for(const k of ['catWelcome','catCelebrate'])if(V[k]){assert.deepEqual([V[k].width,V[k].height],[512,512]);assert(fs.statSync(path.join(root,V[k].src)).size<=60000,k+' weight');const b=fs.readFileSync(path.join(root,V[k].src));assert(b.toString('ascii',12,16)==='VP8X'&&(b[20]&0x10),k+': WebP with alpha')}assert(fs.statSync(path.join(root,V.mascot.src)).size<40000,'mascot optimized for phones');
 // Codex backlog
 const bl=fs.readFileSync(path.join(repo,'CODEX_ART_BACKLOG.md'),'utf8'),items=bl.split(/\n### /).slice(1);
 assert(items.length>=10,'backlog items: '+items.length);
 for(const it of items){for(const f of ['**Шлях:**','**Розмір:**','**Формат:**','**Художній опис:**','**Призначення:**','**Пріоритет:**'])assert(it.includes(f),it.split('\n')[0]+': '+f)}
 for(const [k,e] of entries)if(e.status==='missing')assert(bl.includes('app/'+e.src),'backlog lists '+e.src);
 assert(bl.includes('ART_REQUEST.md')&&!/Olena|Олена/.test(bl),'LIFE items come from ART_REQUEST, Anastasia only');
 console.log('PASS: home v2 static — production CSP (LerenBe 3.0 integration), hook into the existing home, offline files, home-visuals.json ('+entries.length+' slots, approved sizes verified), Codex backlog ('+items.length+' items)');
 // ---- browser
 let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: browser part (Playwright is not installed)');return}
 const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff','.m4a':'audio/mp4','.webmanifest':'application/json','.jpg':'image/jpeg','.txt':'text/plain'};
 const server=http.createServer((q,r)=>{let f=path.join(repo,decodeURIComponent(new URL(q.url,'http://x').pathname));if(!f.startsWith(repo)||!fs.existsSync(f)){r.statusCode=404;return r.end()}if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');r.setHeader('content-type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(r)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/app/';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const release=read('app.js').match(/RELEASE_VERSION="(\d+)"/)[1];
 const open=async(w,h,{art=false,seed={}}={})=>{const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[],outside=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>{(r.request().url().startsWith('https://static.cloudflareinsights.com/')||outside.push(r.request().url())) /* LerenBe 3.0 integration: production analytics beacon blocked, not counted */;r.abort()});
  const heroReq=[];page.on('request',r=>{if(/home-hero-(desktop|mobile)\.webp/.test(r.url()))heroReq.push(r.url())});
  if(!art){const vis=JSON.parse(JSON.stringify(V));vis.hero.status='missing';for(const v of ['desktop','mobile'])vis.hero[v].status='missing';
   await ctx.route('**/img/home/home-visuals.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(vis)}))}
  await page.addInitScript(([r,s])=>{window.__cls=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch(e){}
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:'uk',leren_home_v1:'path',leren_welcome_seen:'true',leren_onboarding_language_v1:'1',...s}))localStorage.setItem(k,v)},[release,seed]);
  await page.goto(base+'index.html');await page.waitForSelector('.td-home',{timeout:20000});await page.waitForTimeout(700);return {ctx,page,errors,outside,missing,heroReq}}; // TEST-050: the home is «Сьогодні з Lexi»
 const report=[];
 try{
  for(const [w,h] of [[360,780],[390,844],[430,932],[1280,800],[1440,900]])for(const art of [false,true]){
   const {ctx,page,errors,outside,missing,heroReq}=await open(w,h,{art,seed:{poly_score:'120'}});
   // TEST-050: the HERO showcase is replaced by «Сьогодні з Lexi» (owner decision); home v2 keeps the «Я вчу» picker in «Навчання».
   assert.equal(await page.locator('.hv-hero, .hv-title').count(),0,'no HERO showcase on «Сьогодні»');assert.deepEqual(heroReq,[],'the HERO picture is never downloaded');
   assert.equal(await page.locator('#learningPath .td-primary').count(),1,'one main action');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll at '+w);
   const cls=await page.evaluate(()=>window.__cls);assert(cls<0.1,'layout shift at '+w+(art?' with art':'')+': '+cls.toFixed(3));
   assert.match(await page.locator('#score').first().textContent(),/120/,'XP from the app');
   await page.evaluate(()=>openLearn());await page.waitForSelector('#learningPath .hv-pick .hv-pick-btn');assert.deepEqual(await page.$$eval('.hv-pick-panel .hv-course',x=>x.map(e=>e.dataset.course)),['nl','en','fr'],'TEST-050: Dutch, English, French');
   assert.deepEqual(outside,[],'no request leaves the test site');assert.deepEqual(missing.filter(u=>/img\/home\//.test(u)),[],'missing art is never requested');
   assert.deepEqual(errors,[]);if(process.env.SHOTS)await page.screenshot({path:path.join(process.env.SHOTS,`home-v2-${w}-${art?'art':'fallback'}.png`)});
   await ctx.close();report.push(w+(art?'+art':''))}
  // interactions (phone)
  {const {ctx,page,errors,outside}=await open(390,844);
   // interface language (the app's own picker in the header): «Сьогодні» follows it
   await page.locator('#uiLangPicker').selectOption('en',{force:true});await page.waitForFunction(()=>/Start learning|Continue/.test(document.querySelector('.td-home .td-start')?.textContent||''));
   await page.locator('#uiLangPicker').selectOption('uk',{force:true});await page.waitForFunction(()=>/Почати навчання|Продовжити/.test(document.querySelector('.td-home .td-start')?.textContent||''));
   // Dutch level («Навчання» → «Я вчу»)
   await page.evaluate(()=>openLearn());await page.click('.hv-pick-btn');await page.click('.hv-level[data-level="A1.2"]');await page.waitForSelector('.hv-level.is-active[data-level="A1.2"]',{state:'attached'});
   await page.click('.hv-pick-btn');await page.click('.hv-level[data-level="A1.1"]');await page.waitForSelector('.hv-level.is-active[data-level="A1.1"]',{state:'attached'});
   // English course player with recorded audio
   await page.click('.hv-pick-btn');await page.click('.hv-course[data-course="en"] button');await page.waitForSelector('.cp-stage');await page.waitForTimeout(500);
   if(!await page.locator('.cp-word').count()){await page.click('.cp-stage .cp-primary');await page.waitForSelector('.cp-word')}await page.locator('.cp-sound').first().click();await page.waitForTimeout(300);
   assert((await page.evaluate(()=>globalThis.__cpRecorded||[])).length>0,'English card plays the recorded voice');await page.click('.cp-close');
   await page.evaluate(()=>localStorage.setItem('leren_learn_lang','nl'));await page.goto(base+'index.html');await page.waitForSelector('.td-home');
   // rewards → progress view («Ще» → «Прогрес і досягнення»)
   await page.click('#modeButtons [data-tab="more"]');await page.click('dialog.td-more [data-more="progress"]');await page.waitForFunction(()=>view==='progress');
   await page.evaluate(()=>openToday());await page.waitForSelector('.td-home');
   // continue → a lesson starts
   await page.click('.td-home .td-start');await page.waitForFunction(()=>document.querySelector('#learningPath')?.dataset.screen==='lesson',null,{timeout:10000});
   assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);await ctx.close();report.push('language uk⇄en, levels, EN player + audio, rewards, continue')}
  // LIFE from «Ще», then a story with recorded voices
  {const {ctx,page,errors}=await open(390,844);const audio=[];page.on('response',r=>{if(/\/audio\/nl(-f)?\/[0-9a-f]{8}\.m4a$/.test(r.url()))audio.push(r.status())});
   await page.click('#modeButtons [data-tab="more"]');await Promise.all([page.waitForURL(/learn-life\.html/),page.click('dialog.td-more [data-more="life"]')]);
   await page.goto(base+'learn-life-story.html?s=first-day');await page.waitForSelector('.ls-hero h1');await page.click('.ls-hero .ls-primary');await page.waitForSelector('.ls-bubble');await page.waitForTimeout(1200);
   await page.locator('.ls-bubble .ls-icon').first().click();await page.waitForTimeout(800);
   assert(audio.length&&audio.every(s=>s===200||s===206),'LIFE lines are recorded clips: '+audio.join(','));assert.deepEqual(errors,[]);await ctx.close();report.push('LIFE from «Ще», recorded voice')}
  console.log('PASS: home v2 in the browser (emulated widths) — '+report.join(', '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
