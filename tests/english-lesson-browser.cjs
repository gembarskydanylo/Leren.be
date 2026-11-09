// First English lesson (English 1.1, chapter «Hello!») in the course player, on a phone: hidden without preview; with
// ?multilang=1 the route home shows English / French / German; a whole lesson (study → listen → check → result) is
// played; progress goes to leren_path_v1@en and the Dutch route is untouched; German says "coming soon" (French has its own test).
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/english-lesson-browser.cjs
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
  // 1. Without preview: nothing new for learners.
  {const {ctx,page,errors}=await open('');assert.equal(await page.locator('.cp-preview').count(),0,'no preview card for learners');assert.deepEqual(errors,[]);await ctx.close()}
  // 2. Preview: play a whole English lesson.
  {const {ctx,page,errors}=await open('?multilang=1');
   const btns=await page.locator('.cp-preview button').evaluateAll(b=>b.map(x=>x.dataset.course));assert.deepEqual(btns,['en','fr','de'],'English, French, German in preview');
   const dutchBefore=await page.evaluate(()=>localStorage.getItem('leren_path_v1'));
   await page.click('.cp-preview [data-course="en"]');await page.waitForSelector('.cp-stage .cp-lessons');
   assert.match(await page.locator('.cp-title').textContent(),/Англійська 1\.1/);assert.equal(await page.locator('.cp-card').count(),12,'6 chapters per level');assert.deepEqual(await page.locator('.cp-level').allTextContents(),['1.1 · Breakthrough (A1)','1.2 · Waystage (A2)'],'level headings');assert.equal(await page.locator('.cp-card').first().locator('.cp-lessons li').count(),6,'6 lessons in chapter 1');assert.equal(await page.locator('.cp-lessons li').count(),72,'36 lessons in English 1.1 and 36 in 1.2');
   const lay=await page.evaluate(()=>({btn:document.querySelector('.cp-stage .cp-primary').getBoundingClientRect().bottom,open:[...document.querySelectorAll('details.cp-card')].filter(d=>d.open).map(d=>d.dataset.chapter)}));
   assert(lay.btn<=844,'start button on the first screen: '+lay.btn);assert.deepEqual(lay.open,['en_hello'],'only the current chapter is open');
   await page.click('.cp-stage .cp-primary');
   const tr=id=>page.evaluate(id=>{for(const t of Object.values(LerenCourseData.en.data))for(const w of t.items)if(w.id===id)return {en:w.en,uk:w.uk};return null},id);
   // study: five cards, the rule on the first one
   assert(await page.locator('.cp-rule').count(),'grammar rule shown');assert.equal(await page.locator('.cp-word').getAttribute('lang'),'en');
   for(let i=0;i<5;i++){await page.locator('.cp-stage .cp-primary').click()}
   await page.locator('.cp-stage .cp-primary',{hasText:'Почуй'}).click();
   // listen: pick the Ukrainian meaning (one wrong answer on purpose), then check: pick the English text
   for(const phase of ['listen','check'])for(let i=0;i<5;i++){
    const id=await page.locator('.cp-stage').getAttribute('data-card');assert.equal(await page.locator('.cp-stage').getAttribute('data-phase'),phase);const w=await tr(id),want=phase==='listen'?w.uk:w.en;
    const opts=await page.locator('.cp-opt').allTextContents();assert.equal(opts.length,4);assert(opts.includes(want),phase+': right answer offered');
    const pick=phase==='listen'&&i===0?opts.find(o=>o!==want):want;await page.locator('.cp-opt',{hasText:pick}).first().click();
    assert.equal(await page.locator('.cp-feedback.is-'+(pick===want?'right':'wrong')).count(),1);await page.locator('.cp-stage .cp-primary').click();
    if(phase==='listen'&&i===4)await page.locator('.cp-stage .cp-primary',{hasText:'Перевір'}).click();
   }
   await page.waitForSelector('.cp-score');assert.equal(await page.locator('.cp-score').textContent(),'5 / 5');assert.equal(await page.locator('.cp-xp').textContent(),'+25 XP','shared points shown');
   if(process.env.SHOT)await page.screenshot({path:process.env.SHOT});
   const store=await page.evaluate(()=>({en:JSON.parse(localStorage.getItem('leren_path_v1@en')),nl:localStorage.getItem('leren_path_v1')}));
   assert.equal(Object.keys(store.en.completed).length,1,'lesson saved in leren_path_v1@en');assert.equal(store.en.completed['en_hello:en_greet:0'],5);
   assert.equal(store.nl,dutchBefore,'Dutch route untouched');assert.deepEqual(store.en.mistakes,[],'a listening mistake is cleared once the word is answered right in the check step');
   // next lesson, and the course home after reopening shows lesson 1 done
   await page.locator('.cp-stage .cp-primary',{hasText:'Наступний урок'}).click();await page.waitForSelector('.cp-word');
   await page.click('.cp-close');await page.click('.cp-preview [data-course="en"]');await page.waitForSelector('.cp-lessons');
   assert.equal(await page.locator('.cp-lessons li.is-done').count(),1);assert.match(await page.locator('.cp-stage .cp-primary').textContent(),/Продовжити/);
   // French and German: coming soon
   for(const l of ['de']){await page.click('.cp-close');await page.click(`.cp-preview [data-course="${l}"]`);await page.waitForSelector('.cp-soon');}
   assert.deepEqual(errors,[]);await ctx.close();report.push('uk phone: full lesson 5/5, saved in @en, Dutch untouched, de soon')}
  // 2a. English 1.1 finished: the course moves on to 1.2 (title, open chapter, first 1.2 lesson), 1.1 results kept.
  {const {ctx,page,errors}=await open('?multilang=1');
   await page.evaluate(()=>{const P=LerenCourseData.en,core=LerenLearningPath,course=core.catalog(P.data,P.curriculum,{text:'en'}),m=core.create(course,localStorage,{key:'leren_path_v1@en'});
    for(const l of course.lessons)if(l.level==='1.1'||course.chapters.find(c=>c.id===l.chapter).level==='1.1')m.state.completed[l.id]=5;m.state.started=true;m.save()});
   await page.click('.cp-preview [data-course="en"]');await page.waitForSelector('.cp-stage .cp-primary');
   assert.match(await page.locator('.cp-title').textContent(),/Англійська 1\.2/,'title shows level 1.2');
   assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('details.cp-card')].filter(d=>d.open).map(d=>d.dataset.chapter)),['en_lastweek'],'first 1.2 chapter open');
   assert.equal(await page.locator('.cp-lessons li.is-done').count(),36);await page.click('.cp-stage .cp-primary');
   assert.equal(await page.locator('.cp-stage').getAttribute('data-card'),'en:was_home','first 1.2 card');
   const st=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_path_v1@en')));assert.equal(st.course,'1.2');assert.equal(Object.keys(st.completed).length,36,'1.1 results kept');
   assert.deepEqual(errors,[]);await ctx.close();report.push('1.1 done → 1.2 starts')}
  // 2b. A device whose voices do not include English: the study card warns that the pronunciation may be wrong.
  {const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());await ctx.route('**/audio/en/manifest.json',r=>r.fulfill({status:404,body:''}));
   await page.addInitScript(([r])=>{try{const s=window.speechSynthesis;if(s)s.getVoices=()=>[{lang:'uk-UA',name:'Lesya'}]}catch(e){}if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:'uk',leren_home_v1:'path',leren_welcome_seen:'true'}))localStorage.setItem(k,v)},[release]);
   await page.goto(base+'?multilang=1');await page.waitForFunction(()=>window.learningPath);await page.evaluate(()=>{setView('path');learningPath.open()});
   await page.click('.cp-preview [data-course="en"]');await page.click('.cp-stage .cp-primary');await page.waitForSelector('.cp-novoice');
   assert.match(await page.locator('.cp-novoice').textContent(),/немає голосу для цієї мови \(англійська\)/);assert.deepEqual(errors,[]);await ctx.close();report.push('no English voice: warning')}
  // 2c. Recorded audio (audio/en/manifest.json): the card plays the recording, so no missing-voice warning even without an English device voice.
  {const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await page.addInitScript(([r])=>{try{const s=window.speechSynthesis;if(s)s.getVoices=()=>[{lang:'uk-UA',name:'Lesya'}]}catch(e){}if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:'uk',leren_home_v1:'path',leren_welcome_seen:'true'}))localStorage.setItem(k,v)},[release]);
   await page.goto(base+'?multilang=1');await page.waitForFunction(()=>window.learningPath);const h=await page.evaluate(()=>audioHash('Hello!'));
   await ctx.route('**/audio/en/manifest.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([h])}));
   await page.evaluate(()=>{setView('path');learningPath.open()});await page.click('.cp-preview [data-course="en"]');await page.waitForTimeout(300);await page.click('.cp-stage .cp-primary');await page.waitForSelector('.cp-word');
   assert.equal(await page.locator('.cp-novoice').count(),0,'no warning when the card is recorded');await page.locator('.cp-sound').first().click();
   assert((await page.evaluate(()=>globalThis.__cpRecorded||[])).includes(h),'recording requested for the card');assert.deepEqual(errors,[]);await ctx.close();report.push('recorded audio used')}
  // 3. Arabic interface: right-to-left player, Arabic translations.
  {const {ctx,page,errors}=await open('?multilang=1','ar');await page.click('.cp-preview [data-course="en"]');await page.click('.cp-stage .cp-primary');
   assert.equal(await page.locator('.cp-stage').getAttribute('dir'),'rtl');assert.equal(await page.locator('.cp-tr').first().textContent(),'مرحبًا!');assert.deepEqual(errors,[]);await ctx.close();report.push('ar: rtl')}
  console.log('PASS: first English lesson — '+report.join('; '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
