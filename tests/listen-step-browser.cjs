// The listening step of a route lesson is compact: no big headphones icon, the picture (≤ 80px) and the yellow
// "Listen" button in one row, the counter and the task on one line, and all four answers visible on a phone
// without scrolling (above the bottom navigation). Phones 390×844 and 320×640, light and dark.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/listen-step-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
const release=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/const RELEASE_VERSION="(\d+)"/)[1];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium');server.close();return}
 const done=[];
 try{
  for(const [w,h] of [[390,844],[320,640]])for(const theme of ['light','dark']){
   const ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await page.addInitScript(([r,t])=>{if(sessionStorage.getItem('seeded'))return;localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:'uk',poly_theme:t,leren_home_v1:'path'}))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1')},[release,theme]);
   await page.goto(base);await page.waitForFunction(()=>window.learningPath);
   // Lesson "Дні й години роботи", listening step, second word (like the reported screen).
   await page.evaluate(()=>{setView('path');const m=learningPath.model,l=LerenLearningPath.catalog(DATA,LerenCurriculum).lessons.find(x=>x.chapter==='opening');m.begin(l.id);m.state.session.phase=1;m.advance(m.current().id,true);m.save();learningPath.open()});
   await page.locator('#learningPath .fh-primary').click(); // "Продовжити урок" opens the paused listening step
   await page.waitForSelector('#learningPath .lp-listen-row');
   const r=await page.evaluate(()=>{const root=document.getElementById('learningPath'),row=root.querySelector('.lp-listen-row'),pic=row.querySelector('.lp-listen-pic'),btn=row.querySelector('button'),opts=[...root.querySelectorAll('.lp-options button')],dock=document.getElementById('modeButtons');
    window.scrollTo(0,0);const dockTop=dock&&getComputedStyle(dock).position==='fixed'?dock.getBoundingClientRect().top:innerHeight;
    return {sound:root.querySelectorAll('.lp-sound').length,pic:pic.getBoundingClientRect().height,btnBg:getComputedStyle(btn).backgroundColor,btnText:btn.textContent,btnOneLine:btn.getBoundingClientRect().height<70,btnIcon:!!btn.querySelector('img,.lbe-emoji')||btn.textContent.includes('🎧'),sameRow:Math.abs(pic.getBoundingClientRect().top+pic.getBoundingClientRect().height/2-(btn.getBoundingClientRect().top+btn.getBoundingClientRect().height/2))<4,
     head:root.querySelector('.lp-listen-head').textContent,opts:opts.length,lastBottom:Math.max(...opts.map(o=>o.getBoundingClientRect().bottom)),dockTop,eyebrow:root.querySelector('.lp-eyebrow').textContent,h2:root.querySelector('h2').textContent}});
   const tag=w+'x'+h+'/'+theme;
   assert.equal(r.sound,0,tag+': no big headphones');assert(r.pic<=80,tag+': picture '+r.pic);assert.equal(r.btnBg,'rgb(253, 218, 36)',tag+': yellow Listen button');assert(r.btnIcon&&/Послухати/.test(r.btnText),tag+': 🎧 Послухати');assert(r.sameRow,tag+': picture and button in one row');
   assert.match(r.head,/^\d \/ \d · /,tag+': counter and task on one line');assert.equal(r.opts,4);assert.equal(r.eyebrow,'A1.1',tag+': topic name not repeated above the lesson title');assert(r.btnOneLine,tag+': button text on one line');
   if(w===390)assert(r.lastBottom<=r.dockTop,tag+': all answers visible without scrolling ('+r.lastBottom+' > '+r.dockTop+')');
   await page.screenshot({path:path.join(process.env.SHOTS||require('node:os').tmpdir(),`listen-step-${w}x${h}-${theme}.png`)});
   // A right answer still works.
   await page.evaluate(()=>{const m=learningPath.model,w=m.current();[...document.querySelectorAll('#learningPath .lp-options button')].find(b=>b.textContent===w.uk).click()});await page.waitForSelector('#learningPath .lp-feedback.lp-correct');
   assert.deepEqual(errors,[],tag);done.push(tag+(r.lastBottom<=r.dockTop?' (all answers on screen)':''));await ctx.close();
  }
  console.log('PASS: compact listening step on '+done.join(', ')+': no big headphones, ≤80px picture and yellow 🎧 button in one row, counter + task on one line');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
