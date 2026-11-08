// Shared progress for the new courses (English): XP for lessons and the exam without double counting, independence from
// the Dutch course, two-device sync, backup and restore, offline files, study minutes while the player is open.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/course-progress-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
const L1='en_hello:en_greet:0',L2='en_hello:en_greet:5';
const DUTCH={leren_path_v1:'{"version":1,"started":true,"completed":{"comm:t_greet:0":4},"mistakes":[]}',leren_path_rewards_v1:'{"comm:t_greet:0":4}'};
(async()=>{
 // 5. Offline: every file of the new courses is in the service worker's precache, with the version index.html loads.
 const sw=read('sw.js'),html=read('index.html');
 for(const m of html.matchAll(/(?:src|href)="\.\/(modules\/(?:courses|course-player)\/[^"]+)"/g))assert(sw.includes('"./'+m[1]+'"'),'precached for offline: '+m[1]);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html?multilang=1';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const device=async(extra={})=>{const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await page.addInitScript(([r,x])=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:'uk',leren_home_v1:'path',leren_welcome_seen:'true',...x}))localStorage.setItem(k,v)},[release,extra]);
  await page.goto(base);await page.waitForFunction(()=>window.learningPath&&window.LerenCourseRewards);return{ctx,page,errors}};
 const xp=page=>page.evaluate(()=>LerenMerge.xpTotal(JSON.parse(localStorage.getItem('leren_xp_v2')||'null')));
 const report=[];
 try{
  const A=await device(DUTCH),dutchBefore=await A.page.evaluate(()=>({p:localStorage.getItem('leren_path_v1'),r:localStorage.getItem('leren_path_rewards_v1')}));
  // 1. Lesson XP once: 5/5 = +25; again 0; worse 0; a new best (another lesson) counts.
  const g=(page,id,c)=>page.evaluate(([id,c])=>LerenCourseRewards.lesson('en',id,c,5),[id,c]);
  const x0=await xp(A.page);assert.equal(await g(A.page,L1,5),25);assert.equal(await g(A.page,L1,5),0,'same lesson again: nothing');assert.equal(await g(A.page,L1,3),0,'worse: nothing');
  assert.equal(await g(A.page,L2,3),15);assert.equal(await g(A.page,L2,5),10,'only the improvement');assert.equal(await xp(A.page)-x0,50);
  for(const bad of [[L1,6],[L1,-1],['nope:x:0',5],[L1,2.5]])assert.equal(await g(A.page,...bad),0,'refused: '+bad);
  assert.equal(await A.page.evaluate(()=>LerenCourseRewards.lesson('en','en_hello:en_greet:0',5,4)),0,'wrong total refused');
  // after a reload the record still holds
  await A.page.reload();await A.page.waitForFunction(()=>window.LerenCourseRewards);assert.equal(await g(A.page,L1,5),0,'no XP again after reload');
  // 7. Exam XP: +10 per answer above the record of each skill
  const ex=(page,b)=>page.evaluate(b=>LerenCourseRewards.exam('en','en11',b),b);
  assert.equal(await ex(A.page,{reading:9,listening:8,writing:8}),250);assert.equal(await ex(A.page,{reading:9,listening:8,writing:8}),0,'exam again: nothing');
  assert.equal(await ex(A.page,{reading:12,listening:8,writing:8}),0,'impossible score refused');
  // 2. Dutch untouched, Dutch lesson XP still works
  const dutchAfter=await A.page.evaluate(()=>({p:localStorage.getItem('leren_path_v1'),r:localStorage.getItem('leren_path_rewards_v1')}));assert.deepEqual(dutchAfter,dutchBefore,'Dutch route and rewards untouched');
  const en=await A.page.evaluate(()=>JSON.parse(localStorage.getItem('leren_path_rewards_v1@en')));assert.deepEqual(Object.keys(en).sort(),[L1,L2,'x:en11:listening','x:en11:reading','x:en11:writing'].sort());
  const nl=await A.page.evaluate(()=>{const l=LerenLearningPath.catalog(DATA,LerenCurriculum).lessons[1];return [recordPathResult(l.id,5,l.ids.length),recordPathResult(l.id,5,l.ids.length)]});assert.deepEqual(nl,[25,0],'Dutch lesson XP as before');
  report.push('lesson/exam XP once, Dutch independent');
  // 6. Minutes while the English player is open (route screen underneath)
  await A.page.evaluate(()=>{setView('path');learningPath.open()});await A.page.click('.cp-preview [data-course="en"]');await A.page.waitForSelector('.cp-stage');
  const ms=await A.page.evaluate(()=>{const before=JSON.stringify(localStorage.getItem('leren_minutes_v2'));actMark();const got=actStep(Date.now()+5000);return {view,got,changed:JSON.stringify(localStorage.getItem('leren_minutes_v2'))!==before}});
  await A.page.click('.cp-stage .cp-primary');assert(await A.page.evaluate(()=>!!localStorage.getItem('leren_path_v1@en')),'English route saved when a lesson starts');
  assert.equal(ms.view,'path');assert(ms.got>0&&ms.changed,'study time counted with the player open: '+JSON.stringify(ms));report.push('minutes counted');
  // 3. Two devices: B did the same first lesson and another one; merge both ways.
  const B=await device();assert.equal(await g(B.page,L1,5),25);assert.equal(await g(B.page,'en_hello:en_intro:0',4),20);
  const snapA=await A.page.evaluate(()=>syncSnapshot()),snapB=await B.page.evaluate(()=>syncSnapshot());
  const merged=await B.page.evaluate(([a,b])=>{const m=syncMerge({},b,a);return {xp:LerenMerge.xpTotal(JSON.parse(m.leren_xp_v2)),en:JSON.parse(m['leren_path_rewards_v1@en']),nl:m.leren_path_rewards_v1}},[snapA,snapB]);
  const xpA=await xp(A.page);assert.equal(merged.xp,xpA+20,'same lesson on two devices counted once, the other lesson added');
  assert.equal(merged.en[L1],5);assert.equal(merged.en['en_hello:en_intro:0'],4);assert.equal(merged.nl,snapA.leren_path_rewards_v1,'Dutch rewards from A kept');
  const mergedRev=await A.page.evaluate(([a,b])=>LerenMerge.xpTotal(JSON.parse(syncMerge({},a,b).leren_xp_v2)),[snapA,snapB]);assert.equal(mergedRev,merged.xp,'same result from either device');
  report.push('two devices merge without double XP');
  // 4. Backup from A, restored on a fresh device C; restoring twice adds nothing.
  const backup=await A.page.evaluate(async()=>JSON.stringify(await backupData()));const C=await device();
  const r1=await C.page.evaluate(t=>backupRestore(t),backup);assert.equal(r1.ok,true,JSON.stringify(r1));
  const after1=await C.page.evaluate(()=>({xp:LerenMerge.xpTotal(JSON.parse(localStorage.getItem('leren_xp_v2'))),en:localStorage.getItem('leren_path_rewards_v1@en'),ex:localStorage.getItem('leren_course_exam_v1@en'),route:localStorage.getItem('leren_path_v1@en')}));
  assert.equal(after1.xp,xpA,'XP restored');assert(after1.en&&after1.route,'English rewards and route restored');
  await C.page.evaluate(t=>backupRestore(t),backup);assert.equal(await xp(C.page),xpA,'restoring twice adds nothing');
  assert.equal(await g(C.page,L1,5),0,'no XP for a lesson already rewarded before the backup');report.push('backup/restore');
  for(const d of [A,B,C]){assert.deepEqual(d.errors,[]);await d.ctx.close()}
  console.log('PASS: shared progress for English — '+report.join('; ')+'; all course files precached for offline');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
