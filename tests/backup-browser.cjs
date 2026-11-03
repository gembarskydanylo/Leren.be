// Progress safety and lesson success in a real browser:
// 1. a lesson finished in 4 minutes with a 10-minute goal is shown as a success, the goal only as a note;
// 2. clearing the site's caches and service worker (what an app update or "clear cache" does) keeps all progress;
// 3. a backup (file) holds every result; after "delete site data" it restores everything; restoring over newer
//    progress keeps the newer results; old v2 clipboard backups still work; guests get a backup reminder.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/backup-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1],SHOTS=process.env.SHOTS||os.tmpdir();
const log=(...a)=>{if(process.env.DEBUG)console.log(...a)};
const seed=(page,data)=>page.addInitScript(([r,d])=>{if(sessionStorage.getItem('seeded'))return;localStorage.clear();const all={leren_release_seen:JSON.stringify(r),poly_ui:'uk',leren_home_v1:'path',...d};for(const [k,v] of Object.entries(all))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1')},[release,data]);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium');server.close();return}
 try{
  // ---- 1. Lesson success before the daily goal (phone).
  {const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await seed(page,{leren_goal_min:'10',leren_minutes_v1:JSON.stringify({days:{[today()]:240}})});
   await page.goto(base);await page.waitForFunction(()=>window.learningPath);await page.evaluate(()=>setView('path'));
   await page.locator('#learningPath .fh-primary').click();await page.locator('#learningPath .lp-primary').click(); // start → intro → begin
   log('lesson');for(let i=0;i<80;i++){
    const step=await page.evaluate(()=>{const root=document.getElementById('learningPath'),m=learningPath.model,s=m.state.session;
     if(root.querySelector('.lp-done'))return 'done';
     if(root.querySelector('.lp-feedback')||s.index===s.ids.length||s.phase===0){root.querySelector('.lp-primary').click();return 'next'}
     const w=m.current(),want=s.phase===1?w.uk:w.nl,b=[...root.querySelectorAll('.lp-options button')].find(x=>x.textContent===want);b.click();return 'answer'});
    if(step==='done')break;
   }
   const box=page.locator('#learningPath .lp-done');await box.waitFor();const text=await box.innerText();
   assert.match(text,/✓ Урок завершено!/);assert.match(text,/Мета дня: 4 з 10 хв\. Урок зараховано/);
   const after=await page.evaluate(()=>({streak:streakState().n,done:Object.keys(learningPath.model.state.completed).length}));
   assert.equal(after.done,1,'lesson saved');assert.equal(after.streak,0,'goal not reached: no streak day, no penalty');
   await page.screenshot({path:path.join(SHOTS,'lesson-done-before-goal.png')});assert.deepEqual(errors,[]);await ctx.close();}

  // ---- 2 and 3. Caches, backup and restore (desktop, with the service worker on).
  {const ctx=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   const y=new Date();y.setDate(y.getDate()-1);const yd=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
   const data={poly_score:'350',poly_progress:JSON.stringify({c_hallo:{seen:3,correct:3,wrong:0,streak:2,due:Date.now()+864e5,known:true}}),poly_toetsbest:JSON.stringify({course_comm_v2:9}),poly_streak:JSON.stringify({n:4,last:yd,best:5}),
    leren_exam12:JSON.stringify({best:{lezen:90,proef:65},wbest:{w1:80}}),leren_skills_v1:JSON.stringify({a12:{lezen:{ok:11,n:12,r:'111111111110'}}}),leren_minutes_v1:JSON.stringify({days:{[yd]:900}}),leren_goal_min:'15',
    leren_achievements_v1:JSON.stringify({version:1,earned:{'xp-100':'2026-01-05T10:00:00.000Z'}})};
   await seed(page,data);await page.goto(base);await page.waitForFunction(()=>window.learningPath);
   log('sw');await page.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');for(let i=0;i<200&&!(await caches.keys()).length;i++)await new Promise(r=>setTimeout(r,100))});
   const keys=Object.keys(data),snap=()=>page.evaluate(k=>Object.fromEntries(k.map(x=>[x,localStorage.getItem(x)])),keys);const before=await snap();
   log('clear');// An app update or "clear cache": every cache and the service worker go away, progress stays.
   const cleared=await page.evaluate(async()=>{const n=(await caches.keys()).length;for(const k of await caches.keys())await caches.delete(k);for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();return n});
   assert(cleared>=1,'the service worker had a cache');await page.reload();await page.waitForFunction(()=>window.learningPath);
   const kept=await snap();for(const k of keys)assert.equal(kept[k],before[k],'kept after clearing caches: '+k);
   // Guest with progress and no backup: a reminder on the progress screen.
   await page.evaluate(()=>setView('progress'));assert.match(await page.locator('#insBackup').innerText(),/видалення даних сайту/);
   await page.screenshot({path:path.join(SHOTS,'backup-reminder.png')});
   log('backup');// Backup as a file (the same keys as the account sync).
   const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#insBackup .btn.primary').click()]);
   assert.match(dl.suggestedFilename(),/^leren-progress-\d{4}-\d{2}-\d{2}\.json$/);const file=path.join(os.tmpdir(),'leren-backup-test.json');await dl.saveAs(file);
   const atBackup=await snap(),backup=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(backup.v,4);assert.match(backup.sha256,/^[0-9a-f]{64}$/);for(const k of keys)assert.equal(backup.keys[k],atBackup[k],'in the backup: '+k);for(const k of ['poly_toetsbest','leren_exam12','poly_streak','leren_skills_v1','leren_minutes_v1','leren_goal_min','leren_achievements_v1'])assert.equal(atBackup[k],before[k],'unchanged by the app: '+k);
   assert.equal(await page.locator('#insBackup').count(),0,'reminder gone after a backup');
   log('delete');// "Delete site data": everything gone, then restore from the file through the Restore button.
   await page.evaluate(()=>{localStorage.clear();sessionStorage.setItem('seeded','1')});await page.reload();await page.waitForFunction(()=>window.learningPath);
   assert.equal(await page.evaluate(()=>localStorage.getItem('poly_toetsbest')),null);
   const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.evaluate(()=>backupImportPick())]);
   await Promise.all([page.waitForEvent('load'),chooser.setFiles(file)]);await page.waitForFunction(()=>window.learningPath);
   const restored=await snap();for(const k of keys)assert.deepEqual(JSON.parse(restored[k]),JSON.parse(atBackup[k]),'restored: '+k);
   assert.deepEqual(await page.evaluate(()=>[score,streakState().n,goalMin()]),[350,4,15]);
   // Restoring an older backup over newer progress keeps the newer results.
   await page.evaluate(()=>{lsSet('poly_toetsbest',{course_comm_v2:10,course_people_v2:7});lsSet('poly_score',500);localStorage.setItem('poly_score','500')});
   const merged=await page.evaluate(async txt=>{await backupRestore(txt);return {t:lsGet('poly_toetsbest',{}),s:localStorage.getItem('poly_score')}},fs.readFileSync(file,'utf8'));
   assert.deepEqual(merged.t,{course_comm_v2:10,course_people_v2:7});assert.equal(merged.s,'500');
   // An old v2 clipboard backup still restores words and points.
   const v2=await page.evaluate(()=>backupRestore(JSON.stringify({v:2,score:777,store:{c_dag:{seen:1,correct:1,wrong:0,streak:1,due:0,known:false}},companion:{}})));assert.equal(v2.ok,true);
   assert.equal((await page.evaluate(()=>backupRestore('{"x":1}'))).ok,false,'not a backup');
   assert.deepEqual(errors,[]);await ctx.close();fs.rmSync(file,{force:true});}
  console.log('PASS: lesson finished at 4 of 10 minutes shown as a success (goal only a note, no streak change); caches and service worker cleared without losing progress; guest reminder; full backup file restores tests, exams, streak, skills, minutes, goal and badges after "delete site data"; restore never lowers newer results; v2 backups still work');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
