// "Topic complete" card on the lesson result: finishing the last lesson of a topic shows «Тема пройдена!», the topic,
// the next topic and «Почати наступну тему» (which opens it); the last topic of a level shows «Блок пройдено!»; repeating a
// lesson of a topic that was already complete shows the normal result. Phone, light and dark, four languages.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/topic-done-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
// Complete every topic before `chapter` in its level and every lesson of `chapter` but the last, then put the last one at its
// final question (so the route really continues with the topic after it).
const setup=chapter=>{setView('path');const m=learningPath.model,cat=LerenLearningPath.catalog(DATA,LerenCurriculum),ls=cat.lessons.filter(x=>x.chapter===chapter);
 const ch=cat.chapters.find(c=>c.id===chapter),before=cat.chapters.filter(c=>c.level===ch.level&&c.index<ch.index).map(c=>c.id);
 for(const l of cat.lessons)if(before.includes(l.chapter))m.state.completed[l.id]=l.ids.length;
 for(const l of ls.slice(0,-1))m.state.completed[l.id]=l.ids.length;const last=ls.at(-1);m.begin(last.id);const s=m.state.session;
 s.phase=2;s.index=s.ids.length-1;s.answers=s.ids.slice(0,-1).map(()=>true);m.save();learningPath.open();return last.id};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const report=[];
 try{
  const open=async(lang,theme='light')=>{const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await page.addInitScript(([r,l,t])=>{if(sessionStorage.getItem('seeded'))return;localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:l,poly_theme:t,leren_home_v1:'path'}))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1')},[release,lang,theme]);
   await page.goto(base);await page.waitForFunction(()=>window.learningPath);return{ctx,page,errors}};
  // Answer the last question right and open the result screen.
  const finishLast=async page=>{await page.locator('#learningPath .fh-primary').click();await page.waitForSelector('#learningPath .lp-options button');
   await page.evaluate(()=>{const w=learningPath.model.current();[...document.querySelectorAll('#learningPath .lp-options button')].find(b=>b.textContent===w.nl).click()});
   await page.locator('#learningPath .lp-primary').last().click();await page.waitForSelector('#learningPath .lp-result')};
  const T={uk:['Тема пройдена!','Анкети й документи','Мій звичайний день','Почати наступну тему'],en:['Topic complete!','Forms and documents','My daily routine','Start the next topic'],
   fr:['Thème terminé !','Formulaires et documents','Ma journée','Commencer le thème suivant'],ar:['اكتمل الموضوع!','الاستمارات والوثائق','يومي المعتاد','ابدأ الموضوع التالي']};
  for(const [lang,[head,topic,next,btn]] of Object.entries(T))for(const theme of lang==='uk'?['light','dark']:['light']){
   const {ctx,page,errors}=await open(lang,theme);
   const order=await page.evaluate(()=>LerenLearningPath.catalog(DATA,LerenCurriculum).chapters.map(c=>c.id));
   assert.equal(order[order.indexOf('forms')+1],'dag','«Мій звичайний день» follows «Анкети й документи»');
   await page.evaluate(setup,'forms');await finishLast(page);
   const card=page.locator('#learningPath .lp-topic-done');await card.waitFor();
   const r=await card.evaluate(c=>({text:c.innerText,next:c.querySelector('button')?.dataset.next,btn:c.querySelector('button')?.textContent,top:c.previousElementSibling?.classList.contains('lp-steps'),before:[...c.parentElement.children].slice(0,[...c.parentElement.children].indexOf(c)).map(e=>e.className+":"+e.innerText.slice(0,40)),
    inView:c.getBoundingClientRect().bottom<=innerHeight+400,btnH:c.querySelector('button').getBoundingClientRect().height}));
   for(const s of [head,topic,next])assert(r.text.includes(s),`${lang}: card shows «${s}»: ${r.text}`);
   assert.equal(r.btn,btn);assert.equal(r.next,'dag');assert(r.top,'card comes right after the lesson header, before the score: '+JSON.stringify(r.before));assert(r.btnH>=44,'big button');
   assert.equal(await page.locator('#learningPath button',{hasText:lang==='uk'?'До наступного уроку':'zzz'}).count(),0,'no second "next lesson" button');
   assert.equal(await page.locator('#learningPath h3',{hasText:lang==='uk'?'Урок пройдено!':'zzz'}).count(),0,'no extra «Урок пройдено!» heading');
   // The button opens the first lesson of the next topic.
   await card.locator('button').click();await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>{const m=learningPath.model;return LerenLearningPath.catalog(DATA,LerenCurriculum).lessons.find(l=>l.id===m.state.session?.lesson)?.chapter}),'dag',`${lang}: next topic started`);
   assert.deepEqual(errors,[]);report.push(lang+'/'+theme);await ctx.close();
  }
  // Repeating a lesson of a topic that is already complete: the normal result, no card.
  {const {ctx,page,errors}=await open('uk');await page.evaluate(setup,'forms');await page.evaluate(()=>{const m=learningPath.model;const id=m.state.session.lesson;m.state.completed[id]=1;m.save()});
   await finishLast(page);assert.equal(await page.locator('#learningPath .lp-topic-done').count(),0,'no card for a topic that was already complete');
   assert(await page.locator('#learningPath button',{hasText:'До наступного уроку'}).count(),'normal next-lesson button');assert.deepEqual(errors,[]);await ctx.close();report.push('repeat')}
  // Last topic of a level: «Блок пройдено!».
  {const {ctx,page,errors}=await open('uk');
   const lastCh=await page.evaluate(()=>{const cat=LerenLearningPath.catalog(DATA,LerenCurriculum),m=learningPath.model,lvl=cat.chapters.find(c=>c.id==='forms').level,chs=cat.chapters.filter(c=>c.level===lvl);
    for(const c of chs.slice(0,-1))for(const l of cat.lessons.filter(x=>x.chapter===c.id))m.state.completed[l.id]=l.ids.length;m.save();return chs.at(-1).id});
   await page.evaluate(setup,lastCh);await finishLast(page);
   const card=page.locator('#learningPath .lp-topic-done.lp-block-done');await card.waitFor();const text=await card.innerText();
   assert(text.includes('Блок пройдено!')&&text.includes('Ти завершив усі теми цього розділу.'),text);assert.deepEqual(errors,[]);await ctx.close();report.push('block ('+lastCh+')')}
  console.log('PASS: topic complete card — '+report.join(', '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
