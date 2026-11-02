// The whole A1.2 final exam in a real browser on a phone and a desktop: every part to the end, all writing tasks,
// all speaking questions, results after a reload, writing from a lesson, and the exam in French and Arabic.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/exam12-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
const log=(...a)=>{if(process.env.DEBUG)console.log(...a)};
const release=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/const RELEASE_VERSION="(\d+)"/)[1];
// Runs inside the page: answers every question of one part correctly and returns the end screen.
async function runPart(part){
 const w=ms=>new Promise(r=>setTimeout(r,ms)),card=document.getElementById('card');
 EXAM12._quiz(part,true);let n=0;
 while(true){
  await w(5);const it=EXAM12._current();
  if(!it||document.querySelector('#card .ex-end'))break;
  if(it.kind==='mc'){const b=[...card.querySelectorAll('.ex-opts .opt')].find(x=>x.textContent===it.ok);if(!b)return {error:'No option '+it.ok+' in '+part};b.click()}
  else if(it.kind==='order'){const flat=x=>x.replace(/[.,!?]+$/,'').toLowerCase(),chips=[...card.querySelectorAll('.ex-pool .ex-chip')];
   for(const word of it.w){const c=chips.find(x=>!x.disabled&&x.textContent===flat(word));if(!c)return {error:'No tile '+word};c.click()}}
  else return {error:'Unknown kind '+it.kind};
  await w(5);const fb=card.querySelector('.ex-fb');if(!fb||!fb.classList.contains('ok'))return {error:'Answer not accepted in '+part+': '+(it.q||it.gap||it.a)};
  card.querySelector('#nx').click();n++;if(n>200)return {error:'Loop'};
 }
 return {n,pct:card.querySelector('.ex-end h2')?.textContent,best:JSON.parse(localStorage.getItem('leren_exam12')).best[part]};
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium ('+e.message.split('\n')[0]+')');server.close();return}
 const done=[];
 try{
  for(const [name,viewport] of [['phone',{width:390,height:844}],['desktop',{width:1366,height:900}]]){
   const ctx=await browser.newContext({viewport,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await page.addInitScript(r=>{if(!sessionStorage.getItem('seeded')){localStorage.clear();localStorage.setItem('leren_release_seen',JSON.stringify(r));localStorage.setItem('poly_toetsbest',JSON.stringify({course_comm_v2:9}));sessionStorage.setItem('seeded','1')}},release);
   await page.goto(base);await page.waitForFunction(()=>window.EXAM12&&window.learningPath);
   const score0=await page.evaluate(()=>score);
   // Open the exam the way a learner does: course A1.2 → Tests → Final exam A1.2.
   await page.evaluate(()=>{switchCourse('a12');setView('toets')});await page.locator('#examPick').click();
   assert.match(await page.locator('.ex-h').innerText(),/A1\.2/);assert.equal(await page.locator('.ex-tile').count(),7);
   // Every quiz part to the end, all answers right.
   for(const part of ['lezen','luisteren','woorden','grammatica','proef']){
    log(name,'part',part);const r=await page.evaluate(runPart,part);assert(!r.error,name+': '+r.error);assert.equal(r.pct,'100%',name+' '+part);assert.equal(r.best,100);
    assert(r.n>=(part==='woorden'?25:part==='proef'?22:14),part+' has all its questions: '+r.n);
   }
   log(name,'wrong answer');
   // A wrong answer is marked wrong and listed for review.
   const wrong=await page.evaluate(async()=>{EXAM12._quiz('lezen',true);await new Promise(r=>setTimeout(r,5));const it=EXAM12._current();
    const b=[...document.querySelectorAll('.ex-opts .opt')].find(x=>x.textContent!==it.ok);b.click();return {bad:!!document.querySelector('.ex-fb.bad'),marked:b.classList.contains('incorrect')}});
   assert(wrong.bad&&wrong.marked,'Wrong answer marked');
   log(name,'writing');
   // Writing: all 18 tasks (exam and lessons) checked with their model.
   const writing=await page.evaluate(async()=>{const out=[];for(const w of EXAM12.tasks()){EXAM12._write(w);await new Promise(r=>setTimeout(r,2));const ta=document.querySelector('.ex-ta');ta.value=w.model;ta.dispatchEvent(new Event('input'));
     [...document.querySelectorAll('#card .row .btn.primary')][0].click();const bad=document.querySelectorAll('.ex-check li.bad').length;out.push([w.id,bad])}return out});
   for(const [id,bad] of writing)assert.equal(bad,0,name+': model of '+id+' has unmet checks');
   log(name,'speaking');
   // Speaking: every question of every topic, then the part shows 100%.
   const speak=await page.evaluate(async()=>{for(const t of EXAM12.data.SPREKEN){EXAM12._speak(t,0);for(let i=0;i<t.qa.length;i++){await new Promise(r=>setTimeout(r,2));document.querySelector('.ex-mark .ex-ok').click()}}return JSON.parse(localStorage.getItem('leren_exam12')).best.spreken});
   assert.equal(speak,100);
   log(name,'reload');
   // XP was earned once per improvement; results survive a reload; other results untouched.
   assert(await page.evaluate(s0=>score>s0,score0),'XP for the exam');
   await page.reload();await page.waitForFunction(()=>window.EXAM12);
   const after=await page.evaluate(()=>({exam:JSON.parse(localStorage.getItem('leren_exam12')).best,toets:JSON.parse(localStorage.getItem('poly_toetsbest'))}));
   for(const p of ['lezen','luisteren','woorden','grammatica','proef','schrijven','spreken'])assert.equal(after.exam[p],100,'Saved: '+p);
   assert.equal(after.toets.course_comm_v2,9);
   await page.evaluate(()=>{switchCourse('a12');setView('toets')});await page.locator('#examPick').click();
   assert.equal(await page.locator('.ex-tile.ok').count(),7,'All parts show as passed after a reload');
   await page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),`exam12-${name}-home.png`)});
   log(name,'lesson writing');
   // Writing from a lesson: topic page → writing block → task → back to the topic.
   await page.evaluate(()=>{setView('path');learningPath.chapter('wonen')});await page.waitForSelector('.fh-write');
   assert.equal(await page.locator('.fh-write-task').count(),1);await page.locator('.fh-write-task').first().click();
   await page.waitForSelector('.ex-ta');assert.match(await page.locator('.ex-q').innerText(),/орендодавц/);
   await page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),`exam12-${name}-lesson-write.png`)});
   await page.locator('.ex-back').click();await page.waitForSelector('.fh-write');assert.match(await page.locator('.fh-map-heading h2').innerText(),/Житло/);
   for(const ch of ['past','holiday','travel','service','wonen','contact','reading','grammar2','daily','work','zorg','stad','school','vrijetijd','sociaal','future']){
    await page.evaluate(c=>learningPath.chapter(c),ch);assert(await page.locator('.fh-write-task').count()>=1,'Writing practice on topic '+ch);
   }
   log(name,'languages');
   // French and Arabic interface of the exam.
   for(const [lang,word,dir] of [['fr','Examen final','ltr'],['ar','الامتحان النهائي','rtl']]){
    await page.evaluate(l=>{uiLang=l;switchCourse('a12');setView('toets')},lang);await page.locator('#examPick').click();
    assert.match(await page.locator('.ex-h').innerText(),new RegExp(word));assert.equal(await page.locator('#card').getAttribute('dir'),dir);
    const q=await page.evaluate(async()=>{EXAM12._quiz('lezen',true);await new Promise(r=>setTimeout(r,5));return document.querySelector('#card h3.ex-q').textContent});
    assert(!/[а-яіїє]/i.test(q),lang+' question is not Ukrainian: '+q);
    if(lang==='ar')await page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),`exam12-${name}-ar.png`)});
   }
   assert.deepEqual(errors,[],'No page errors on '+name);done.push(name);await ctx.close();
  }
 }finally{await browser.close();server.close()}
 console.log('PASS: final exam A1.2 on '+done.join(' and ')+': all parts to 100%, wrong answers marked, 18 writing models, 36 speaking questions, results and XP saved after a reload, writing from all 16 topics, French and Arabic');
})().catch(e=>{console.error(e);server.close();process.exit(1)});
