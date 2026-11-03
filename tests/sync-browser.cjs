// Two isolated browser profiles (a phone and a computer) with one account, against a local stand-in for the Firestore
// REST API that behaves like the real one for this app: the users/{uid} document, updateTime preconditions (412 on a
// stale write), the 900,000-character blob limit from firestore.rules (403), and injected 403/429/500 errors and
// network loss. Firebase sign-in itself is replaced by a signed-in user object; the app's own sync code runs unchanged.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/sync-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
const html=read('index.html'),release=html.match(/const RELEASE_VERSION="(\d+)"/)[1],script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const log=(...a)=>{if(process.env.DEBUG)console.log(...a)};
const pctx=vm.createContext({console});vm.runInContext(read('course-curriculum.js')+'\n'+script.slice(0,script.indexOf('function validStored'))+'\nglobalThis.fixture={DATA,LerenCurriculum};',pctx);vm.runInContext(read('modules/learning-path/core.js'),pctx);
const course=pctx.LerenLearningPath.catalog(pctx.fixture.DATA,pctx.fixture.LerenCurriculum),a11=course.lessons.filter(l=>course.chapters.find(c=>c.id===l.chapter).level==='A1.1'),a12=course.lessons.filter(l=>course.chapters.find(c=>c.id===l.chapter).level==='A1.2');
// ---- Firestore stand-in
const cloud={docs:{},fail:[],writes:0,reads:0,down:false};
async function firestore(route){
 const req=route.request(),url=new URL(req.url()),uid=decodeURIComponent(url.pathname.split('/users/')[1]||'');
 if(cloud.down)return route.abort('internetdisconnected');
 const f=cloud.fail.shift();if(f)return route.fulfill({status:f,contentType:'application/json',body:'{"error":{"code":'+f+'}}'});
 const doc=cloud.docs[uid];
 if(req.method()==='GET'){cloud.reads++;if(!doc)return route.fulfill({status:404,body:'{}'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({fields:{blob:{stringValue:doc.blob}},updateTime:doc.updateTime})})}
 if(req.method()==='PATCH'){const want=url.searchParams.get('currentDocument.updateTime'),exists=url.searchParams.get('currentDocument.exists');
  if(want!==null&&(!doc||doc.updateTime!==want)||exists==='false'&&doc)return route.fulfill({status:412,body:'{"error":{"code":412}}'});
  const blob=JSON.parse(req.postData()).fields.blob.stringValue;if(blob.length>=900000)return route.fulfill({status:403,body:'{"error":{"code":403}}'}); // firestore.rules
  cloud.writes++;const updateTime=new Date(Date.now()+cloud.writes).toISOString();cloud.docs[uid]={blob,updateTime};return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({updateTime})})}
 return route.fulfill({status:405,body:'{}'});
}
const cloudData=uid=>JSON.parse(cloud.docs[uid].blob);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium');server.close();return}
 const errors=[];
 async function profile(name,seed,viewport){
  const ctx=await browser.newContext({viewport,serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));page.on('dialog',d=>{page.lastDialog=d.message();d.type()==='confirm'?(page.confirmAnswer===false?d.dismiss():d.accept()):d.accept()});
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());await ctx.route(/firestore\.googleapis\.com/,firestore);
  await page.addInitScript(([r,d])=>{if(sessionStorage.getItem('seeded'))return;localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:'uk',...d}))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1')},[release,seed]);
  await page.goto(base);await page.waitForFunction(()=>window.learningPath&&document.readyState!=='loading');return {ctx,page,name};
 }
 // Sign in (a stand-in for Firebase Auth) and sync; a sync that changed local data reloads the page like in the app.
 const login=(p,uid='u1')=>p.page.evaluate(u=>{acct.user={uid:u,email:u+'@example.com',getIdToken:async()=>'token-'+u};acct.mod={signOut:async()=>{}};acctRender()},uid);
 // Sync until nothing changes any more (the app also syncs again after the reload a merge causes).
 async function settle(p,uid='u1'){for(let i=0;i<4;i++)if(!await sync(p,uid))return}
 async function sync(p,uid='u1',how='pull'){let nav=false;const h=()=>{nav=true};p.page.on('framenavigated',h);await login(p,uid);
  await p.page.evaluate(h=>(h==='push'?syncPush():syncPull()).then(()=>true),how).catch(()=>{});await p.page.waitForTimeout(300);p.page.off('framenavigated',h);log('sync',p.name,how,'nav',nav,cloud.reads,cloud.writes);
  if(nav){await p.page.waitForFunction(()=>window.learningPath&&document.readyState!=='loading');await login(p,uid)}return nav}
 const state=p=>p.page.evaluate(()=>({score,status:syncStatus(),line:syncLine(),xp:LerenMerge.xpTotal(lsGet('leren_xp_v2',{})),path:Object.keys(lsGet('leren_path_v1',{}).completed||{}).sort(),
  skills:LerenMerge.skillsView(skillsStore()),minutes:minutesToday(),toets:lsGet('poly_toetsbest',{}),at:lsGet('leren_sync_at',0)}));
 try{
  // ---- Old data on the phone (v174 keys), a brand-new computer.
  const old={poly_score:'400',poly_progress:JSON.stringify({c_hallo:{seen:3,correct:3,wrong:0,streak:2,due:Date.now()+864e5,known:true}}),poly_toetsbest:JSON.stringify({course_comm_v2:9}),
   leren_path_v1:JSON.stringify({version:1,started:true,entry:a11[0].id,completed:{[a11[0].id]:5},mistakes:[],session:null,placement:null}),leren_path_rewards_v1:JSON.stringify({[a11[0].id]:5}),
   leren_skills_v1:JSON.stringify({a11:{lezen:{ok:8,n:10,r:'1111111100'}}}),leren_minutes_v1:JSON.stringify({days:{'2026-10-30':600}})};
  const phone=await profile('phone',old,{width:390,height:844}),laptop=await profile('laptop',{},{width:1280,height:900});
  const p0=await state(phone);assert.equal(p0.score,400,'old points read');assert.equal(p0.skills.a11.lezen.n,10,'old skills read');
  log('first syncs');
  await sync(phone);if(process.env.DEBUG)console.log(await phone.page.evaluate(()=>{const a=JSON.parse(acct.lastSnap||'{}'),b=syncSnapshot();return [syncStatus(),typeof syncSame,acct.lastSnap.length,!!acct.user,acct.err,Object.keys(a).length,Object.keys(b).length,syncSame(acct.lastSnap,b)]}));const st0=await state(phone);if(process.env.DEBUG)console.log(st0.status,await phone.page.evaluate(()=>{const a=JSON.parse(acct.lastSnap||'{}'),b=syncSnapshot();return Object.keys({...a,...b}).filter(k=>a[k]!==b[k]).map(k=>k+': '+String(a[k]).slice(0,120)+' | '+String(b[k]).slice(0,120))}));assert.equal(st0.status,'synced');assert(cloud.docs.u1,'cloud copy written');
  await sync(laptop);const l0=await state(laptop);assert.equal(l0.score,400,'new computer gets the points');assert.deepEqual(l0.path,[a11[0].id]);assert.equal(l0.skills.a11.lezen.n,10);assert.equal(l0.status,'synced');
  // ---- Both devices work offline at the same time.
  log('concurrent work');const both=a11[2].id;
  await phone.page.evaluate(([x,y,n])=>{addXP(30);const m=learningPath.model;for(const [id,k] of [[x,n.x],[y,n.y]]){recordPathResult(id,k,k);m.state.completed[id]=k}m.save();for(let i=0;i<3;i++)skillLog('lezen',true,'a11');const now=Date.now();actTick=now-5000;actMark();setView('lesson');actStep(now)},[a11[1].id,both,{x:a11[1].ids.length,y:a11[2].ids.length}]);
  await laptop.page.evaluate(([x,y,n])=>{switchCourse('a12');addXP(20);const m=learningPath.model;for(const [id,k] of [[x,n.x],[y,n.y]]){recordPathResult(id,k,k);m.state.completed[id]=k}m.save();skillLog('lezen',false,'a12');skillLog('lezen',true,'a11');const now=Date.now();actTick=now-5000;actMark();setView('lesson');actStep(now)},[a12[0].id,both,{x:a12[0].ids.length,y:a11[2].ids.length}]);
  const gain=l=>l.ids.length*5,expected=400+30+20+gain(a11[1])+gain(a12[0])+gain(a11[2]);
  assert.equal((await state(phone)).status,'pending','local changes wait for the cloud');
  await sync(phone,'u1','push');await sync(laptop,'u1','push');await settle(phone);await settle(laptop);await settle(phone);
  const p1=await state(phone),l1=await state(laptop);
  if(process.env.DEBUG)for(const p of [phone,laptop])console.log(p.name,await p.page.evaluate(()=>{const a=JSON.parse(localStorage.getItem('leren_sync_base')||'{}'),b=syncSnapshot();return Object.keys({...a,...b}).filter(k=>a[k]!==b[k]).map(k=>k+': '+String(a[k]).slice(0,150)+' | '+String(b[k]).slice(0,150))}));
  for(const s of [p1,l1]){assert.equal(s.score,expected,'XP: both devices\' answers add, the lesson done on both counts once');assert.deepEqual(s.path,[a11[0].id,a11[1].id,a11[2].id,a12[0].id].sort(),'lessons of A1.1 and A1.2 from both devices');
   assert.equal(s.skills.a11.lezen.n,14,'10 old + 3 phone + 1 computer');assert.equal(s.skills.a12.lezen.n,1);assert.equal(s.status,'synced')}
  assert.equal(p1.minutes,l1.minutes);
  // ---- Repeated syncs add nothing.
  if(process.env.DEBUG)for(const p of [phone,laptop])console.log('R',p.name,await p.page.evaluate(()=>{const a=JSON.parse(localStorage.getItem('leren_sync_base')||'{}'),b=syncSnapshot();return Object.keys({...a,...b}).filter(k=>syncDeep(a[k])!==syncDeep(b[k])).map(k=>k+': '+String(a[k]).slice(0,300)+' | '+String(b[k]).slice(0,300))}),JSON.stringify(cloudData('u1').poly_progress).slice(0,300));
  log('repeat');for(let i=0;i<3;i++){await sync(phone);await sync(laptop)}assert.equal((await state(phone)).score,expected,'no double XP after repeated syncs');assert.equal((await state(laptop)).score,expected);
  assert.equal(cloudData('u1').poly_score,String(expected));
  // ---- No internet: an honest error, nothing claimed as saved; back online: synced.
  log('offline');const at=(await state(phone)).at;await phone.page.evaluate(()=>addXP(5));cloud.down=true;await phone.ctx.setOffline(true);await sync(phone,'u1','push');
  let s=await state(phone);assert.equal(s.status,'error');assert.match(s.line,/помилка синхронізації: немає інтернету/);assert.equal(s.at,at,'no new "saved" time');
  assert.equal(await phone.page.locator('#acctHint').getAttribute('data-sync'),'error');
  cloud.down=false;await phone.ctx.setOffline(false);await phone.page.waitForTimeout(800);s=await state(phone);
  if(s.status!=='synced'){await sync(phone,'u1','push');s=await state(phone)}assert.equal(s.status,'synced','synced again after coming online');assert.equal(cloudData('u1').poly_score,String(expected+5));
  // ---- Server errors: 403, 429, 500 shown, retried; then success.
  log('server errors');for(const [code,re] of [[403,/немає доступу/],[429,/сервер зайнятий/],[500,/помилка сервера/]]){await phone.page.evaluate(()=>addXP(1));cloud.fail.push(code);await sync(phone,'u1','push');s=await state(phone);assert.equal(s.status,'error',code);assert.match(s.line,re)}
  await phone.page.evaluate(()=>{acct.err="";});await sync(phone,'u1','push');assert.equal((await state(phone)).status,'synced');
  // ---- The 900,000-character limit: not sent, shown as an error, progress kept on the device.
  log('size');const writes=cloud.writes;await phone.page.evaluate(()=>localStorage.setItem('leren_big_test','x'.repeat(900000)));await sync(phone,'u1','push');s=await state(phone);
  assert.equal(s.status,'error');assert.match(s.line,/завеликий/);assert.equal(cloud.writes,writes,'nothing sent');await phone.page.evaluate(()=>{localStorage.removeItem('leren_big_test');acct.err=""});await sync(phone,'u1','push');assert.equal((await state(phone)).status,'synced');
  // ---- Old v2 backup on the computer: nothing lowered. A damaged v4 backup: nothing changed.
  log('backups');const before=await state(laptop);
  const v2=JSON.stringify({v:2,score:100,store:{c_hallo:{seen:1,correct:0,wrong:1,streak:0,due:0,known:false}},companion:{leren_path_v1:{version:1,started:true,completed:{[a11[0].id]:1},mistakes:[]}}});
  const r2=await laptop.page.evaluate(t=>backupRestore(t),v2);assert(r2.ok);await laptop.page.reload();await laptop.page.waitForFunction(()=>window.learningPath&&document.readyState!=='loading');
  const after=await state(laptop);assert.equal(after.score,before.score,'points not lowered');assert.deepEqual(after.path,before.path);
  assert.equal(await laptop.page.evaluate(id=>lsGet('leren_path_v1',{}).completed[id],a11[0].id),5,'better lesson result kept');assert.equal(await laptop.page.evaluate(()=>stateFor('c_hallo').known),true,'newer word state kept');
  const good=await laptop.page.evaluate(()=>backupData().then(JSON.stringify)),snapBefore=await laptop.page.evaluate(()=>JSON.stringify(syncSnapshot()));
  for(const t of [good.slice(0,good.length-30),good.replace(/"poly_score":"\d+"/,'"poly_score":"999999"'),'{"app":"leren.be","v":3,"keys":{"poly_progress":"{\\"w\\":{\\"seen\\":\\"x\\"}}"}}']){
   const r=await laptop.page.evaluate(t=>backupRestore(t),t);assert.equal(r.ok,false,'damaged backup rejected');assert.equal(await laptop.page.evaluate(()=>JSON.stringify(syncSnapshot())),snapBefore,'nothing changed')}
  const r4=await laptop.page.evaluate(t=>backupRestore(t),good);assert(r4.ok);const r4b=await laptop.page.evaluate(t=>backupRestore(t),good);assert.equal(r4b.changed,0,'restoring the same backup twice changes nothing');
  assert.equal((await state(laptop)).score,before.score,'no XP from restoring');
  // ---- Another account on the same phone: asked before merging; "cancel" shows only that account (a device copy is kept).
  log('other account');phone.page.confirmAnswer=false;await sync(phone,'u2');assert.match(phone.page.lastDialog||'',/іншого акаунта/);
  const other=await state(phone);assert.equal(other.score,0,'u2 does not get u1\'s progress');assert(await phone.page.evaluate(()=>!!lsGet('leren_sync_backup',null)),'device copy kept');
  assert.equal(cloudData('u1').poly_score,String(expected+5+3),'u1 cloud untouched');
  await phone.page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),'sync-phone-status.png')});
  await login(laptop);await laptop.page.evaluate(()=>setView('progress'));assert.match(await laptop.page.locator('#rewardSaveStatus').innerText(),/синхронізовано|очікує/);
  await laptop.page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),'sync-laptop-progress.png')});
  assert.deepEqual(errors,[],'no page errors');
  console.log('PASS: two isolated profiles, one account: old data moved to a new computer; simultaneous A1.1/A1.2 lessons, answers, skills and minutes on both devices merged; the same lesson record counted once; repeated syncs without double XP; offline, 403/429/500 and the 900,000-character limit shown as sync errors with no false "saved"; recovery when back online; v2 backup lowers nothing; damaged backups change nothing; restoring twice adds nothing; another account asked before merging');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
