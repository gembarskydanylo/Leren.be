// French 1.1 in the course player (preview), on a phone: a whole lesson, saved in leren_path_v1@fr with shared points, English and
// Dutch progress untouched; with a French or English interface the translation is never the French text itself.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/french-lesson-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const open=async(query,ui='uk')=>{const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await page.addInitScript(([r,u])=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:u,leren_home_v1:'path',leren_welcome_seen:'true',leren_path_v1:'{"version":1,"started":true,"completed":{"x":3},"mistakes":[]}'}))localStorage.setItem(k,v)},[release,ui]);
  await page.goto(base+query);await page.waitForFunction(()=>window.learningPath);await page.evaluate(()=>{setView('path');learningPath.open()});await page.waitForTimeout(300);return{ctx,page,errors}};
 const report=[];
 try{
  // 1. Preview: a whole French lesson on a phone.
  {const {ctx,page,errors}=await open('?multilang=1');
   const enBefore=await page.evaluate(()=>localStorage.getItem('leren_path_v1@en')),nlBefore=await page.evaluate(()=>localStorage.getItem('leren_path_v1'));
   await page.click('.cp-preview [data-course="fr"]');await page.waitForSelector('.cp-stage .cp-primary');
   assert.match(await page.locator('.cp-title').textContent(),/Французька 1\.1/);assert.equal(await page.locator('.cp-card').count(),6);assert.equal(await page.locator('.cp-lessons li').count(),36);
   assert.equal(await page.locator('.cp-level').count(),0,'one level: no level headings');assert.equal(await page.locator('.cp-exam').count(),0,'no French exam yet');
   await page.click('.cp-stage .cp-primary');assert.equal(await page.locator('.cp-word').getAttribute('lang'),'fr');assert.equal(await page.locator('.cp-word').textContent(),'Bonjour !');
   assert.equal(await page.locator('.cp-tr').first().textContent(),'Добрий день! / Вітаю!');assert(await page.locator('.cp-rule').count(),'rule shown');
   const tr=id=>page.evaluate(id=>{for(const t of Object.values(LerenCourseData.fr.data))for(const w of t.items)if(w.id===id)return {fr:w.fr,uk:w.uk};return null},id);
   for(let i=0;i<5;i++)await page.locator('.cp-stage .cp-primary').click();
   await page.locator('.cp-stage .cp-primary',{hasText:'Почуй'}).click();
   for(const phase of ['listen','check'])for(let i=0;i<5;i++){
    const id=await page.locator('.cp-stage').getAttribute('data-card');const w=await tr(id),want=phase==='listen'?w.uk:w.fr;
    const opts=await page.locator('.cp-opt').allTextContents();assert(opts.includes(want),phase+': right answer offered');
    await page.locator('.cp-opt',{hasText:want}).first().click();await page.locator('.cp-stage .cp-primary').click();
    if(phase==='listen'&&i===4)await page.locator('.cp-stage .cp-primary',{hasText:'Перевір'}).click()}
   await page.waitForSelector('.cp-score');assert.equal(await page.locator('.cp-score').textContent(),'5 / 5');assert.equal(await page.locator('.cp-xp').textContent(),'+25 XP','shared points');
   const said=await page.evaluate(()=>globalThis.__cpSaid||[]);assert(said.includes('Bonjour !'),'French text read aloud');
   const st=await page.evaluate(()=>({fr:JSON.parse(localStorage.getItem('leren_path_v1@fr')),en:localStorage.getItem('leren_path_v1@en'),nl:localStorage.getItem('leren_path_v1'),rw:JSON.parse(localStorage.getItem('leren_path_rewards_v1@fr')||'{}')}));
   assert.equal(st.fr.completed['fr_hello:fr_greet:0'],5,'saved in leren_path_v1@fr');assert.equal(st.en,enBefore,'English untouched');assert.equal(st.nl,nlBefore,'Dutch untouched');
   assert.equal(st.rw['fr_hello:fr_greet:0'],5,'reward record in the French key');
   assert.deepEqual(errors,[]);await ctx.close();report.push('uk phone: French lesson 5/5, +25 XP, saved in @fr, en/nl untouched')}
  // 2. French interface learning French: the translation is Ukrainian, never the French text itself.
  {const {ctx,page,errors}=await open('?multilang=1','fr');await page.click('.cp-preview [data-course="fr"]');await page.click('.cp-stage .cp-primary');
   assert.equal(await page.locator('.cp-tr').first().textContent(),'Добрий день! / Вітаю!');assert.deepEqual(errors,[]);await ctx.close();report.push('fr interface: no French-as-translation')}
  // 3. English interface: English translation; voice asked for fr-BE.
  {const {ctx,page,errors}=await open('?multilang=1','en');await page.click('.cp-preview [data-course="fr"]');await page.click('.cp-stage .cp-primary');
   assert.equal(await page.locator('.cp-tr').first().textContent(),'Hello!');assert.equal(await page.evaluate(()=>LerenCourses.VOICE.fr),'fr-BE');assert.deepEqual(errors,[]);await ctx.close();report.push('en interface: English translation, fr-BE voice')}
  console.log('PASS: French 1.1 lesson — '+report.join('; '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
