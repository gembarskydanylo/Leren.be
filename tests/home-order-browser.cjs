// Home order on a phone: a learner who has started sees «Продовжити урок» on the first screen, above the showcase, and the
// progress card adds no second primary button; a new visitor meets the showcase first. Exactly one .fh-primary either way.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/home-order-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const report=[];
 try{
  for(const started of [true,false]){
   const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await page.addInitScript(r=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:'uk',leren_home_v1:'path'}))localStorage.setItem(k,v)},release);
   await page.goto(base);await page.waitForFunction(()=>window.learningPath);
   await page.evaluate(s=>{setView('path');if(s){const m=learningPath.model,l=LerenLearningPath.catalog(DATA,LerenCurriculum).lessons.find(x=>x.chapter==='opening');m.begin(l.id);m.save()}learningPath.open();scrollTo(0,0)},started);
   await page.waitForTimeout(600);
   const r=await page.evaluate(()=>{const lp=document.getElementById('learningPath'),p=[...lp.querySelectorAll('.fh-primary')],hero=lp.querySelector('.fh-hero'),show=lp.querySelector('.hs-intro, [class*="showcase"]');
    const y=e=>e?e.getBoundingClientRect().top+scrollY:null;return{primaries:p.map(b=>b.textContent.trim()),heroY:y(hero),showY:y(show),btnBottom:p[0]?p[0].getBoundingClientRect().bottom+scrollY:null,card:lp.querySelector('.fh-pcard-empty')?.innerText||''}});
   assert.equal(r.primaries.length,1,(started?'started':'new')+': one primary action, got '+JSON.stringify(r.primaries));
   if(r.showY!=null)assert(started?r.heroY<r.showY:r.showY<r.heroY,(started?'started: lesson above the showcase':'new: showcase first')+' '+JSON.stringify(r));
   if(started){assert.match(r.primaries[0],/Продовжити урок/);assert(r.btnBottom<=844,'«Продовжити урок» on the first screen: '+r.btnBottom);assert.match(r.card,/Перший урок уже розпочато/)}
   assert.deepEqual(errors,[]);report.push((started?'started':'new')+': '+r.primaries[0]+(started?' at '+Math.round(r.btnBottom)+'px':''));await ctx.close();
  }
  console.log('PASS: home order — '+report.join('; '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
