// Release 275 · Codex P1-02 in a real browser: an update whose app files cannot all be downloaded must not replace the
// working offline app. Chromium on localhost (phone viewport), real Service Worker, no network beyond localhost.
// Per case: install PREV (release 264 by default) completely; deploy this tree while ONE shell file answers HTTP 503 during
// the update; the new worker must not activate, the PREV cache stays, and offline the app (route, Today) still starts with
// the learner's XP. Then the file is back: the update installs, only the new cache is left, and offline reload works.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict'),{execSync}=require('node:child_process');
const repo=path.join(__dirname,'..'),PREV=process.env.PREV||'origin/main';
const cacheOf=s=>(s.match(/const CACHE_NAME = "(leren-be-v\d+)"/)||[])[1];
(async()=>{
 try{execSync(`git -C "${repo}" rev-parse --verify ${PREV}`,{stdio:'ignore'})}catch{console.log('SKIP: '+PREV+' not available (shallow clone?)');return}
 let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');return}
 const prevRoot=fs.mkdtempSync(path.join(os.tmpdir(),'lerenbe-prev-'));
 execSync(`git -C "${repo}" archive ${PREV} | tar -x -C "${prevRoot}"`,{maxBuffer:1<<30});
 const prevCache=cacheOf(fs.readFileSync(path.join(prevRoot,'sw.js'),'utf8')),curCache=cacheOf(fs.readFileSync(path.join(repo,'sw.js'),'utf8'));
 const prevRelease=(fs.readFileSync(path.join(prevRoot,'app.js'),'utf8').match(/RELEASE_VERSION="(\d+)"/)||[])[1],curRelease=curCache.replace(/\D/g,'');
 assert.notEqual(prevCache,curCache,'PREV and this tree need different cache names');
 let root=prevRoot,block=null;
 const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.m4a':'audio/mp4','.webmanifest':'application/manifest+json','.woff2':'font/woff2','.tsv':'text/plain'};
 const server=http.createServer((q,r)=>{const p=decodeURIComponent(new URL(q.url,'http://x').pathname);
  if(block&&p==='/'+block){r.statusCode=503;return r.end('test outage')}
  let f=path.join(root,p);if(f.endsWith(path.sep))f+='index.html';
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.statusCode=404;return r.end()}
  r.setHeader('content-type',T[path.extname(f)]||'application/octet-stream');r.setHeader('cache-control','no-cache');fs.createReadStream(f).pipe(r)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const B='http://localhost:'+server.address().port+'/';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const SEED={poly_ui:'uk',leren_welcome_seen:'true',leren_onboarding_language_v1:'1',leren_start_known_v1:'"zero"',leren_tour_done:'true',leren_level_asked:'1',leren_release_seen:'"'+prevRelease+'"'};
 const appWorks=page=>page.evaluate(()=>({release:typeof RELEASE_VERSION==='string'?RELEASE_VERSION:null,core:!!window.LerenLearningPath,model:!!(window.learningPath&&learningPath.model),xp:typeof score==='number'?score:null,buttons:document.querySelectorAll('#learningPath button').length}));
 const results=[];
 try{
  for(const file of ['modules/learning-path/core.js','modules/today/ui.js','modules/focus-lesson/style.css']){
   root=prevRoot;block=null;
   const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
   await page.addInitScript(s=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},SEED);
   await page.goto(B);await page.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:60000}).catch(async()=>{await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:60000})});
   await page.waitForFunction(n=>caches.keys().then(k=>k.includes(n)),prevCache,{timeout:120000});await page.reload();
   await page.waitForFunction(()=>typeof addXP==='function'&&window.learningPath,null,{timeout:30000});
   await page.evaluate(()=>{for(let i=0;i<5;i++)addXP(10,'sw-test:'+i)});const xp=await page.evaluate(()=>score);
   // deploy this tree while one app file is unavailable
   root=repo;block=file;
   await page.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update()).catch(()=>{}));
   await page.waitForTimeout(1500);
   await page.waitForFunction(()=>navigator.serviceWorker.getRegistration().then(r=>!r.installing&&!r.waiting),null,{timeout:120000});
   const st=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {keys:await caches.keys(),active:r.active&&r.active.state}});
   assert(st.keys.includes(prevCache),file+': the previous cache is kept ('+st.keys.join(', ')+')');
   // offline: the previous release still starts, with the learner's data
   await ctx.setOffline(true);await page.reload();await page.waitForFunction(()=>window.learningPath&&learningPath.model,null,{timeout:30000});
   const off=await appWorks(page);
   assert.equal(off.release,prevRelease,file+': offline the working release '+prevRelease+' opens');assert(off.core&&off.model&&off.buttons>0,file+': route and Today work offline '+JSON.stringify(off));assert.equal(off.xp,xp,file+': XP unchanged');
   // the file is back: the update installs, the old cache goes, offline works on the new release
   await ctx.setOffline(false);block=null;
   await page.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update()).catch(()=>{}));
   await page.waitForFunction(n=>caches.keys().then(k=>k.length===1&&k[0]===n),curCache,{timeout:180000});
   await page.reload();await page.waitForFunction(v=>typeof RELEASE_VERSION==='string'&&RELEASE_VERSION===v&&window.learningPath,curRelease,{timeout:30000});
   await ctx.setOffline(true);await page.reload();await page.waitForFunction(()=>window.learningPath&&learningPath.model,null,{timeout:30000});
   const fin=await appWorks(page);assert.equal(fin.release,curRelease);assert(fin.core&&fin.model&&fin.buttons>0,file+': new release works offline');assert.equal(fin.xp,xp,file+': XP unchanged after the update');
   await page.evaluate(()=>learningPath.start());await page.waitForTimeout(400);
   assert(await page.evaluate(()=>document.documentElement.classList.contains('lp-focus')),file+': offline a lesson opens in Focus');
   assert.deepEqual(errors,[],file+': no page errors');
   results.push(`${file} 503 → ${prevCache} kept, offline ${off.release} OK; back online → ${curCache} only, offline ${fin.release} + lesson OK`);
   await ctx.close();
  }
  console.log('PASS: partial update '+prevCache+' → '+curCache+' — '+results.join(' | '));
 }finally{await browser.close();server.close();fs.rmSync(prevRoot,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
