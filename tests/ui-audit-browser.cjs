// UI walk-through on phones (390×844 light, 320×640 dark, Arabic): the layout glitches found in the audit stay fixed.
// - no page wider than the screen; back buttons in games and exams at least 44px tall;
// - compact listening and checking steps in route lessons (small picture in a row, all answers above the bottom nav on 390×844);
// - dictation without the big headphones icon, the input wider than the check button;
// - games home without the duplicate "Ігри" line and empty bar;
// - no Dutch "Toets" in Ukrainian/Arabic labels, right-pointing back arrows in Arabic exams;
// - answer buttons and course cards never break a word letter by letter (hyphenation only).
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/ui-audit-browser.cjs
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
  for(const [w,h,theme,lang] of [[390,844,'light','uk'],[320,640,'dark','uk'],[390,844,'light','ar']]){
   const tag=w+'x'+h+'/'+theme+'/'+lang,ctx=await browser.newContext({viewport:{width:w,height:h},serviceWorkers:'block',isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await page.addInitScript(([r,t,l])=>{if(sessionStorage.getItem('seeded'))return;localStorage.clear();for(const [k,v] of Object.entries({leren_release_seen:JSON.stringify(r),poly_ui:l,poly_theme:t,leren_home_v1:'path',leren_char:JSON.stringify('peter')}))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1')},[release,theme,lang]);
   await page.goto(base);await page.waitForFunction(()=>window.learningPath&&window.EXAM12);
   const wide=()=>page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   // Route lesson: listening and checking steps.
   await page.evaluate(()=>{setView('path');const m=learningPath.model,l=m.recommended();m.begin(l.id);while(m.state.session.index<m.state.session.ids.length)m.advance(m.current().id,true);m.nextPhase();learningPath.open()});
   await page.locator('#learningPath .fh-primary').click();await page.waitForSelector('#learningPath .lp-listen-row');
   for(const step of ['listen','check']){
    if(step==='check'){await page.evaluate(()=>{const m=learningPath.model,s=m.state.session;while(s.index<s.ids.length)m.advance(m.current().id,true);m.nextPhase();learningPath.open()});await page.locator('#learningPath .fh-primary').click();await page.waitForSelector('#learningPath .lp-check-row')}
    const r=await page.evaluate(()=>{const root=document.getElementById('learningPath'),pic=root.querySelector('.lp-listen-pic'),opts=[...root.querySelectorAll('.lp-options button')],dock=document.getElementById('modeButtons');scrollTo(0,0);
     return {pic:pic.getBoundingClientRect().height,sound:root.querySelectorAll('.lp-sound').length,last:Math.max(...opts.map(o=>o.getBoundingClientRect().bottom)),navTop:dock.getBoundingClientRect().top}});
    assert(r.pic<=80,tag+' '+step+': small picture '+r.pic);assert.equal(r.sound,0);if(h>=800)assert(r.last<=r.navTop,tag+' '+step+': all answers above the nav');
   }
   assert(await wide()<=0,tag+': no horizontal scroll in lessons');
   // Games home: no duplicate title line and empty bar.
   await page.evaluate(()=>setView('games'));assert.equal(await page.locator('main .meta').isVisible(),false,tag+': games home has no extra title line');assert.equal(await page.locator('main > .bar').isVisible(),false);
   // Dictation: no big icon, wide input; the back button is a real tap target.
   await page.evaluate(()=>dcStart());const dc=await page.evaluate(()=>{const c=document.getElementById('card'),i=c.querySelector('.g-type input'),b=c.querySelector('.g-type .btn'),back=c.querySelector('.g-back');
    return {icon:c.querySelectorAll('.q .icon-box').length,input:i.getBoundingClientRect().width,btn:b.getBoundingClientRect().width,btnRight:b.getBoundingClientRect().right,cardRight:c.getBoundingClientRect().right,back:back.getBoundingClientRect().height,backText:back.textContent}});
   assert.equal(dc.icon,0,tag+': no big headphones');assert(dc.input>=dc.btn*0.8||dc.input>=200,tag+': input '+dc.input+' vs button '+dc.btn);assert(dc.btnRight<=dc.cardRight,tag+': check button inside the card');assert(dc.back>=44,tag+': back button '+dc.back);
   if(lang==='ar')assert.match(dc.backText,/^→/,tag+': back arrow points right in Arabic');
   // Header line: a long subtitle does not squeeze the title ("Склади слово").
   await page.evaluate(()=>{setView('games');document.querySelector('[data-game="wb"]').click()});await page.waitForTimeout(150);const meta=await page.evaluate(()=>{const p=document.getElementById('prog'),rg=document.createRange();rg.selectNodeContents(p);return {lines:new Set([...rg.getClientRects()].map(r=>Math.round(r.top))).size,t:p.textContent}});assert.equal(meta.lines,1,tag+': game title on one line '+JSON.stringify(meta));
   // Exams: localized back labels, arrows, tap targets.
   await page.evaluate(()=>{switchCourse('a12');setView('toets');document.getElementById('examPick').click()});
   const ex=await page.evaluate(()=>{const b=document.querySelector('#card .ex-back');return {t:b.textContent,h:b.getBoundingClientRect().height}});
   assert(ex.h>=44,tag+': exam back '+ex.h);assert(!/Toets/.test(ex.t),tag+': no Dutch "Toets" in '+ex.t);if(lang==='ar')assert.match(ex.t,/^→/);
   const dock=await page.evaluate(()=>[...document.querySelectorAll('#modeButtons button')].map(b=>b.textContent).join('|'));assert(!/Toets/.test(dock),tag+': nav '+dock);
   await page.evaluate(()=>EXAM12._quiz('luisteren',true));const lb=await page.evaluate(()=>[...document.querySelectorAll('#card button')].map(b=>b.textContent).join('|'));assert(!/▶/.test(lb),tag+': no blue ▶ emoji on the listen button');
   // No word broken letter by letter in answer buttons or course cards.
   const broken=await page.evaluate(()=>{const bad=[];for(const e of document.querySelectorAll('.opt,.fh-course-sub,.topic-name')){const s=getComputedStyle(e);if(s.overflowWrap==='anywhere'||s.wordBreak==='break-all')bad.push(e.className)}return bad});
   assert.deepEqual(broken,[],tag);
   assert.deepEqual(errors,[],tag);done.push(tag);await ctx.close();
  }
  console.log('PASS: UI walk-through on '+done.join(', ')+': compact listen/check steps, no horizontal scroll, 44px back buttons, compact dictation, clean games home, one-line game titles, localized "Tests" and RTL arrows, no ▶ emoji, no letter-by-letter word breaks');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
