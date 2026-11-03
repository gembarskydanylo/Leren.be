// Smart review: spaced intervals (modules/review/srs.js), the daily warm-up of the guided route
// (modules/learning-path/core.js) and the real app flow in a browser (Peter's plan → warm-up → next lesson).
// Run: node tests/smart-review.cjs (the browser part is skipped without Playwright).
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx=vm.createContext({console});vm.runInContext(read('modules/review/srs.js'),ctx);const S=ctx.LerenSRS,DAY=864e5,now=Date.UTC(2026,10,2,12);
const card=()=>({seen:1,correct:0,wrong:0,streak:0,due:0,known:false});

// 1. Intervals grow with right answers in a row: 1, 3, 7, 14, 30, 30 days.
{const s=card(),gaps=[];for(let i=0;i<6;i++){S.update(s,true,now);gaps.push((s.due-now)/DAY)}
 assert.equal(JSON.stringify(gaps),'[1,3,7,14,30,30]');assert.equal(s.known,true);assert.equal(s.correct,6);}
// 2. A mistake brings the word back today and starts the steps again.
{const s=card();for(let i=0;i<4;i++)S.update(s,true,now);S.update(s,false,now);
 assert.equal(s.due,now);assert.equal(s.streak,0);assert.equal(s.known,false);assert.equal(s.wrong,1);
 S.update(s,true,now);assert.equal((s.due-now)/DAY,1,'after a mistake the next step is 1 day again');}
// 3. Due list: only seen words past their date; forgotten words first, then the longest overdue.
{const st={a:{...card(),due:now-DAY},b:{...card(),due:now-5*DAY},c:{...card(),wrong:3,due:now},d:{...card(),due:now+DAY},e:{...card(),seen:0,due:0}};
 const ids=S.due(['a','b','c','d','e'].map(id=>({id})),id=>st[id],now).map(x=>x.id);
 assert.equal(ids.join(),'c,b,a');}
// 4. Old saves keep working: the stored format is unchanged and old 3-day dates stay as they are.
{const s={seen:4,correct:3,wrong:1,streak:3,due:now-1,known:true};S.update(s,true,now);assert.deepEqual(Object.keys(s).sort(),['correct','due','known','seen','streak','t','wrong']);assert.equal((s.due-now)/DAY,14);}

// 5. The app uses the same rules everywhere (lessons, games and the guided route) and no old fixed interval is left.
{const html=require(__dirname+'/lib/app-source.cjs')();assert(!/\(s\.streak>=3\?3:1\)\*864e5/.test(html),'old fixed interval removed');
 assert.equal((html.match(/LerenSRS\.update\(s,/g)||[]).length,9,'4 lesson/game modes × right and wrong + the guided route');
 assert(html.includes('<script src="./modules/review/srs.js?v=175"></script>'));assert(read('sw.js').includes('"./modules/review/srs.js?v=175"'));}

// 6. Guided route: warm-up of up to 5 words of the current course, route mistakes first, once a day, from 3 words.
const html=require(__dirname+'/lib/app-source.cjs')(),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const pctx=vm.createContext({console});
vm.runInContext(read('course-curriculum.js')+'\n'+script.slice(0,script.indexOf('function validStored'))+'\nglobalThis.fixture={DATA,LerenCurriculum};',pctx);
vm.runInContext(read('modules/learning-path/core.js'),pctx);
const {DATA,LerenCurriculum}=pctx.fixture,LP=pctx.LerenLearningPath,course=LP.catalog(DATA,LerenCurriculum);
const mem=()=>{const m={};return {getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=String(v)}}};
{const storage=mem(),m=LP.create(course,storage),a11=course.lessons.filter(l=>l.chapter==='comm').flatMap(l=>l.ids),a12=course.chapters.find(c=>c.level==='A1.2').lessons[0].ids;
 const day1=new Date(2026,10,2,9),day1later=new Date(2026,10,2,20),day2=new Date(2026,10,3,9);
 assert.equal(m.warmupDue(a11.slice(0,5),day1),false,'not before the route started');m.start();
 assert.equal(m.warmupDue(a11.slice(0,2),day1),false,'fewer than 3 words: straight to the lesson');
 assert.equal(m.warmupDue(a12.slice(0,5),day1),false,'words of the other course do not count');
 m.state.mistakes=[a11[7]];
 assert.equal(JSON.stringify(m.warmupIds([a11[1],a12[0],a11[2],a11[3],a11[4],a11[5]])),JSON.stringify([a11[7],a11[1],a11[2],a11[3],a11[4]]),'mistakes first, max 5, own course only');
 assert(m.warmupDue(a11.slice(0,5),day1));assert(m.beginWarmup(a11.slice(0,5),day1));
 assert.equal(m.state.session.kind,'review');assert.equal(m.state.session.phase,2);assert.equal(m.state.session.ids.length,5);
 // Answer the warm-up, then the route goes on to the next lesson.
 for(const id of [...m.state.session.ids])m.advance(id,true);assert.equal(m.finish().kind,'review');
 const next=m.continueRoute();assert(next&&m.state.session.kind==='lesson'&&m.state.session.lesson===next.id);
 assert.equal(m.warmupDue(a11.slice(0,5),day1later),false,'once a day');assert.equal(m.warmupDue(a11.slice(0,5),day2),true,'again the next day');
 // The warm-up day survives a reload; a broken value is ignored.
 assert.equal(LP.create(course,storage).warmupDue(a11.slice(0,5),day1later),false);
 const raw=JSON.parse(storage.getItem(LP.KEY));raw.warmed='yesterday';storage.setItem(LP.KEY,JSON.stringify(raw));assert.equal(LP.create(course,storage).warmupDue(a11.slice(0,5),day1later),true);}

console.log('PASS: spaced intervals 1/3/7/14/30 days, mistakes back today, forgotten words first, unchanged save format, one rule in all modes, daily route warm-up (3–5 words, own course, mistakes first, once a day, survives reload)');

// 7. Browser: the home screen shows Peter's plan, "Continue" opens the warm-up, after it the next lesson starts.
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP browser part: Playwright is not installed');process.exit(0)}
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP browser part: no Chromium');server.close();return}
 const release=html.match(/const RELEASE_VERSION="(\d+)"/)[1];
 try{
  for(const [name,viewport] of [['phone',{width:390,height:844}],['desktop',{width:1366,height:900}]]){
   const ctx=await browser.newContext({viewport,serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   // A learner who started the route and has 6 words of "Знайомство" past their review date (one answered wrong 3 times).
   await page.addInitScript(([r,ids])=>{if(sessionStorage.getItem('seeded'))return;localStorage.clear();localStorage.setItem('leren_release_seen',JSON.stringify(r));localStorage.setItem('leren_home_v1','path');localStorage.setItem('poly_ui','uk');
    const store={};ids.forEach((id,i)=>store[id]={seen:2,correct:1,wrong:i===4?3:0,streak:i===4?0:1,due:Date.now()-864e5,known:false});localStorage.setItem('poly_progress',JSON.stringify(store));
    localStorage.setItem('leren_path_v1',JSON.stringify({version:1,started:true,entry:'comm:basis:0',completed:{'comm:basis:0':5},mistakes:[],session:null,placement:null}));sessionStorage.setItem('seeded','1')},[release,course.lessons.filter(l=>l.chapter==='comm').flatMap(l=>l.ids).slice(0,6)]);
   await page.goto(base);await page.waitForFunction(()=>window.learningPath);await page.evaluate(()=>setView('path'));
   const plan=page.locator('#learningPath .fh-plan');await plan.waitFor();const text=await plan.innerText();
   assert.match(text,/Peter|Dafna/);assert.match(text,/повторимо 5 слів/,name+': plan '+text);
   const first=await page.evaluate(()=>learningPath.model.warmupIds(dueItems(curLevel).map(x=>x.id))[0]);
   assert.equal(first,course.lessons.filter(l=>l.chapter==='comm').flatMap(l=>l.ids)[4],'the forgotten word comes first');
   await page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),'smart-review-'+name+'-home.png')});
   await page.locator('#learningPath .fh-primary').click();await page.waitForSelector('#learningPath .lp-options');
   assert.equal(await page.evaluate(()=>learningPath.model.state.session.kind),'review');
   // Answer all 5 warm-up words right; the words move to their next review date.
   for(let i=0;i<5;i++){await page.evaluate(()=>{const m=learningPath.model,w=m.current(),opt=[...document.querySelectorAll('#learningPath .lp-options button')].find(b=>b.textContent===w.nl);opt.click()});await page.locator('#learningPath .lp-primary').click()}
   const after=await page.evaluate(()=>({due:dueItems(curLevel).length,store:JSON.parse(localStorage.getItem('poly_progress'))}));
   assert.equal(after.due,1,'5 words reviewed, 1 left for later');
   await page.locator('#learningPath .lp-primary',{hasText:/урок/i}).first().click();await page.waitForFunction(()=>learningPath.model.state.session?.kind==='lesson');
   // Back home: no second warm-up today, the plan is gone.
   await page.evaluate(()=>learningPath.home());assert.equal(await page.locator('#learningPath .fh-plan').count(),0);
   // The free scenario stays on the home screen.
   assert.equal(await page.locator('#learningPath .fh-free').count(),1);
   assert.deepEqual(errors,[],'No page errors on '+name);await ctx.close();
  }
  console.log('PASS: browser on phone and desktop: Peter\'s plan, warm-up with the forgotten word first, dates moved, next lesson, once a day, free study still offered');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
