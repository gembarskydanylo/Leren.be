// English 1.1 final exam in the course player, on a phone (preview): a perfect run (100%, every skill full, saved, best
// shown on the course home), a run with mistakes (per-skill results, each mistake with the right answer and the
// explanation, "practise my mistakes" with immediate feedback), and a device without speech (listening not scored).
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/english-exam-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
const TYPED={w5:'My name is Olena.',w6:'am',w7:"I've got two children.",w8:'How much is it?'};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html?multilang=1';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const open=async({voice=true}={})=>{const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await page.addInitScript(([r,v])=>{if(!v){try{delete window.speechSynthesis;delete Window.prototype.speechSynthesis;delete window.SpeechSynthesisUtterance}catch(e){}} // like a browser without speech: the API does not exist
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();for(const [k,val] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:'uk',leren_home_v1:'path',leren_welcome_seen:'true'}))localStorage.setItem(k,val)},[release,voice]);
  await page.goto(base);await page.waitForFunction(()=>window.learningPath);await page.evaluate(()=>{setView('path');learningPath.open()});
  await page.click('.cp-preview [data-course="en"]');await page.waitForSelector('.cp-exam');await page.click('.cp-exam');await page.waitForSelector('.ex-intro');return{ctx,page,errors}};
 // Answers one item; wrong=true picks a wrong option / wrong text.
 const answer=async(page,wrong)=>{
  const id=await page.locator('.cp-body').getAttribute('data-item');const it=await page.evaluate(id=>{const E=LerenCourseExams.en11;return [...E.reading.flatMap(t=>t.items),...E.listening,...E.writing,...E.speaking].find(x=>x.id===id)},id);
  if(it.options){const want=it.options[it.answer],pick=wrong?it.options.find(o=>o!==want):want;await page.locator('.cp-opt',{hasText:pick}).first().click();return id}
  if(it.tiles){const words=wrong?[...it.tiles].reverse():it.answer.split(' ');for(const w of words)await page.locator('.ex-tile:not([disabled])',{hasText:w}).first().click();await page.locator('.cp-primary').click();return id}
  if(it.prompt){await page.fill('.ex-input',wrong?'I like it':TYPED[id]);await page.locator('.ex-form .cp-primary').click();return id}
  await page.locator('.cp-btn',{hasText:'Показати приклад'}).click();assert(await page.locator('.ex-model').isVisible());await page.locator('.cp-primary').click();return id};
 const report=[];
 try{
  {const {ctx,page,errors}=await open();
   assert.match(await page.locator('.ex-note').textContent(),/не офіційний сертифікат CEFR чи Cambridge/);
   const shot=async name=>{if(process.env.SHOTS)await page.screenshot({path:path.join(process.env.SHOTS,'exam-'+name+'.png')})};await shot('intro');
   await page.click('.ex-intro ~ .cp-primary');await shot('reading');let n=0;while(await page.locator('.ex-result').count()===0){if(n===13)await shot('writing-order');await answer(page,false);n++;assert(n<40)}
   assert.equal(n,30,'30 items');assert.equal(await page.locator('.cp-score').textContent(),'100%');assert.equal(await page.locator('.ex-xp').textContent(),'+250 XP','exam points shown once');assert.match(await page.locator('.ex-verdict').textContent(),/складено/);
   const skills=await page.locator('.ex-skills li').evaluateAll(l=>l.map(x=>x.dataset.skill+':'+x.querySelector('strong').textContent));
   assert.deepEqual(skills,['reading:9 / 9','listening:8 / 8','writing:8 / 8','speaking:тренування, не оцінюється']);assert.equal(await page.locator('.ex-mistake').count(),0);
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_course_exam_v1@en')));assert.deepEqual(saved.en11.best,{reading:9,listening:8,writing:8});assert.equal(saved.en11.lastPct,100);
   assert.equal(await page.evaluate(()=>localStorage.getItem('leren_course_exam_v1')),null,'nothing written to an unsuffixed key');
   await page.locator('.cp-btn',{hasText:'До курсу'}).click();assert.match(await page.locator('.cp-exam').textContent(),/100%/,'best shown on the course home');
   // second run: every third item wrong
   await page.click('.cp-exam');await page.click('.ex-intro ~ .cp-primary');let k=0;const wrongIds=[];
   while(await page.locator('.ex-result').count()===0){const w=k%3===0;const id=await answer(page,w);if(w&&!id.startsWith('s'))wrongIds.push(id);k++}
   assert.equal(await page.locator('.ex-xp').count(),0,'no points for a weaker second attempt');
   if(process.env.SHOTS)await page.screenshot({path:path.join(process.env.SHOTS,'exam-result.png'),fullPage:true});
   const ms=await page.locator('.ex-mistake').evaluateAll(l=>l.map(x=>({id:x.dataset.item,right:x.querySelector('.ex-right').textContent,why:x.querySelector('.ex-why').textContent})));
   assert.deepEqual(ms.map(m=>m.id).sort(),wrongIds.sort(),'every mistake listed');assert(ms.every(m=>m.right.length>10&&m.why.length>10),'right answer and explanation');
   assert(await page.locator('.ex-verdict.is-fail, .ex-verdict.is-pass').count());
   const best=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_course_exam_v1@en')).en11);assert.deepEqual(best.best,{reading:9,listening:8,writing:8},'best kept');assert.equal(best.attempts,2);
   // practise the mistakes: immediate feedback, then done
   await page.locator('.cp-primary',{hasText:'Потренувати помилки'}).click();for(let j=0;j<ms.length;j++){await answer(page,false);await page.waitForSelector('.cp-feedback.is-right');await page.locator('.cp-primary').click()}
   await page.waitForSelector('.cp-stage .cp-h:has-text("Готово")');assert.deepEqual(errors,[]);await ctx.close();report.push(`100% run; ${ms.length} mistakes explained and practised`)}
  {const {ctx,page,errors}=await open({voice:false});await page.click('.ex-intro ~ .cp-primary');let n=0;
   while(await page.locator('.ex-result').count()===0){if(await page.locator('.ex-note',{hasText:'немає англійського голосу'}).count()){await page.locator('.cp-primary').click()}else await answer(page,false);n++;assert(n<40)}
   const li=await page.locator('.ex-skills li[data-skill="listening"] strong').textContent();assert.equal(li,'не оцінено');assert.equal(await page.locator('.cp-score').textContent(),'100%','score from reading + writing only');
   assert.deepEqual(errors,[]);await ctx.close();report.push('no voice: listening not scored')}
  console.log('PASS: English 1.1 exam on a phone — '+report.join('; '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
