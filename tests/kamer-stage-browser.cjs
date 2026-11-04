// Kamer room games in their full-screen stage: big 3D room on desktop/tablet/phone, camera (drag, wheel, buttons, reset),
// HUD (progress, score, sound, full screen, close), right/wrong answers, reload, other games untouched.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/kamer-stage-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
const SIZES=[[1920,1080],[1536,960],[768,1024],[390,844],[360,800]];
// what is drawn of the room: union of all its faces on screen
const measure=()=>{const sc=document.querySelector('.k-scene').getBoundingClientRect();let l=1e9,t=1e9,r=-1e9,b=-1e9;
 for(const f of document.querySelectorAll('.k-room .k-face')){const q=f.getBoundingClientRect();if(!q.width)continue;l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);b=Math.max(b,q.bottom)}
 const st=document.querySelector('.k-stage').getBoundingClientRect();
 return{scene:{w:sc.width,h:sc.height,l:sc.left,t:sc.top,r:sc.right,b:sc.bottom},room:{w:r-l,h:b-t,l,t,r,b},stage:{w:st.width,h:st.height},vw:innerWidth,vh:innerHeight,
  hscroll:document.documentElement.scrollWidth>innerWidth,htmlOverflow:getComputedStyle(document.documentElement).overflow,
  ry:document.querySelector('.k-room').style.getPropertyValue('--ry'),tf:document.querySelector('.k-room').style.transform}};
const scaleOf=tf=>+((tf||'').match(/scale3d\(([\d.]+)/)||[])[1];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch(e){console.log('SKIP: no Chromium');server.close();return}
 const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
 const errors=[];
 const open=async(w,h,{level='a11',game='kamer1',touch=false}={})=>{
  const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch,serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(w+'x'+h+': '+e.message));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await page.addInitScript(r=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();localStorage.setItem('poly_ui','uk');localStorage.setItem('leren_release_seen',JSON.stringify(r))},release);
  await page.goto(base);await page.waitForFunction(()=>window.learningPath);
  await page.evaluate(l=>{curLevel=l;setView('games');renderGamesHome()},level);await page.click('[data-game="'+game+'"]');await page.waitForSelector('.k-menu');
  return{ctx,page};
 };
 try{
  // 1. size and framing on five screens
  const report=[];
  for(const [w,h] of SIZES){
   const {ctx,page}=await open(w,h,{touch:w<700});
   await page.locator('.k-task').first().click();await page.waitForSelector('.k-choice');await page.waitForTimeout(400);
   const m=await page.evaluate(measure);
   assert.equal(m.stage.w,w,'stage uses the full width');assert.equal(m.stage.h,h,'stage uses the full height');
   assert.equal(m.hscroll,false,'no horizontal scroll');assert.equal(m.htmlOverflow,'hidden','page behind the game does not scroll');
   // the scene is the main element and the room fills it without spilling out of it
   const sceneShare=m.scene.w*m.scene.h/(w*h);assert(sceneShare>(w>=1000?.55:.38),w+'x'+h+': scene too small ('+sceneShare.toFixed(2)+')');
   const fill=Math.max(m.room.w/m.scene.w,m.room.h/m.scene.h);assert(fill>.7,w+'x'+h+': room fills only '+fill.toFixed(2)+' of the scene');
   assert(m.room.l>=m.scene.l-2&&m.room.r<=m.scene.r+2&&m.room.t>=m.scene.t-2&&m.room.b<=m.scene.b+2,w+'x'+h+': room is cut off '+JSON.stringify(m));
   // HUD and answers are on screen and big enough for fingers
   const ui=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return{prog:document.querySelector('.k-chip-prog').textContent,score:document.querySelector('.k-chip-score').textContent,
    close:r('.k-close'),sound:r('.k-sound'),menu:r('.k-hud-menu'),choices:[...document.querySelectorAll('.k-choice')].map(c=>{const q=c.getBoundingClientRect();return[q.top,q.bottom,q.height,q.width]})}});
   assert.match(ui.prog,/1 \/ 3/);assert.match(ui.score,/0/);
   for(const k of ['close','sound','menu'])assert(ui[k].width>=44&&ui[k].height>=44&&ui[k].right<=w,k+' button size');
   for(const [top,bottom,hh,ww] of ui.choices){assert(hh>=48&&ww>=200,'answer button size');assert(top>=0,'answer on screen')}
   report.push(w+'x'+h+' room '+Math.round(fill*100)+'%');
   await ctx.close();
  }
  // 2. camera, answers, sound, full screen, close, reload (desktop, mouse)
  {
   const {ctx,page}=await open(1536,960);
   await page.locator('.k-task').first().click();await page.waitForSelector('.k-choice');await page.waitForTimeout(300);
   const m0=await page.evaluate(measure),s0=scaleOf(m0.tf);
   await page.click('.k-zoom-in');await page.waitForTimeout(600);const s1=scaleOf((await page.evaluate(measure)).tf);assert(s1>s0*1.1,'zoom in');
   await page.click('.k-zoom-out');await page.click('.k-zoom-out');await page.waitForTimeout(600);const s2=scaleOf((await page.evaluate(measure)).tf);assert(s2<s0,'zoom out');
   for(let i=0;i<12;i++)await page.click('.k-zoom-out');await page.waitForTimeout(600);assert(scaleOf((await page.evaluate(measure)).tf)>=s0*.79,'zoom out is limited');
   const c=m0.scene;await page.mouse.move(c.l+c.w*.15,c.t+c.h*.9);await page.mouse.wheel(0,-400);await page.waitForTimeout(600);assert(scaleOf((await page.evaluate(measure)).tf)>s0*.8,'wheel zooms in');
   // drag turns the room, with limits (the camera never goes behind the walls)
   await page.mouse.move(c.l+c.w*.1,c.t+c.h*.92);await page.mouse.down();await page.mouse.move(c.l+c.w*.1+300,c.t+c.h*.92,{steps:8});await page.mouse.up();await page.waitForTimeout(700);
   const ry1=parseFloat((await page.evaluate(measure)).ry);assert(ry1>-24+40,'drag turns the room ('+ry1+')');
   await page.mouse.move(c.l+c.w*.1,c.t+c.h*.92);await page.mouse.down();await page.mouse.move(c.l+c.w*.1+1500,c.t+c.h*.92,{steps:8});await page.mouse.up();await page.waitForTimeout(800);
   assert(parseFloat((await page.evaluate(measure)).ry)<=50.01,'turning is limited');
   await page.click('.k-reset');await page.waitForTimeout(900);const mr=await page.evaluate(measure);assert.equal(parseFloat(mr.ry),-22,'reset view');assert(Math.abs(scaleOf(mr.tf)-s0)<.01,'reset zoom');
   // a drag must not count as a tap on an object
   assert.equal(await page.locator('.k-react').count(),0);
   // wrong answer: soft red, the right one is shown, the score stays; right answer: green, spoken, +1
   await page.evaluate(()=>{window.__said=[];const o=window.say;window.say=(t,...a)=>{window.__said.push(t);return o&&o(t,...a)}});
   const right=await page.evaluate(()=>'Dit is een '+LerenKamer.O[document.querySelector('.k-obj.is-hint').dataset.item][1]+'.');
   await page.locator('.k-choice:not([data-ok="1"])').first().click();
   assert.equal(await page.locator('.k-choice.is-wrong').count(),1);assert.equal(await page.locator('.k-choice.is-answer').count(),1);
   assert.match(await page.locator('.k-chip-score').textContent(),/0/);
   assert(await page.evaluate(r=>window.__said.includes(r),right),'the right answer is spoken after a mistake');
   await page.waitForSelector('.k-choices:not(.is-done) .k-choice');assert.match(await page.locator('.k-chip-prog').textContent(),/2 \/ 3/);
   const right2=await page.evaluate(()=>'Dit is een '+LerenKamer.O[document.querySelector('.k-obj.is-hint').dataset.item][1]+'.');
   await page.locator('.k-choice',{hasText:right2}).click();
   assert.equal(await page.locator('.k-choice.is-right').count(),1);assert.match(await page.locator('.k-chip-score').textContent(),/1/);
   assert(await page.evaluate(r=>window.__said.includes(r),right2),'the right answer is spoken');
   // sound off: nothing is spoken, the choice is remembered
   await page.click('.k-sound');assert.equal(await page.getAttribute('.k-sound','aria-pressed'),'true');assert.equal(await page.evaluate(()=>localStorage.leren_kamer_mute),'1');
   await page.waitForSelector('.k-choices:not(.is-done) .k-choice');const n=await page.evaluate(()=>window.__said.length);
   await page.locator('.k-choice').first().click();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__said.length),n,'muted: nothing spoken');
   await page.click('.k-sound');assert.equal(await page.evaluate(()=>localStorage.leren_kamer_mute),'0');
   // full screen and back
   if(await page.evaluate(()=>document.fullscreenEnabled)){
    await page.click('.k-full');await page.waitForFunction(()=>document.fullscreenElement&&document.fullscreenElement.classList.contains('k-stage'));
    await page.click('.k-full');await page.waitForFunction(()=>!document.fullscreenElement);
   }
   // task result, then the menu button and the close button
   await page.waitForSelector('.k-result');assert.equal(await page.locator('.k-stage').count(),1);
   await page.click('.k-hud-menu');await page.waitForSelector('.k-menu');assert.equal(await page.locator('.k-stage').count(),0);
   assert.notEqual(await page.evaluate(()=>getComputedStyle(document.documentElement).overflow),'hidden','page scrolls again');
   await page.click('.k-big');await page.waitForSelector('.k-stage');await page.click('.k-close');await page.waitForSelector('[data-game="kamer1"]');
   assert.equal(await page.locator('.k-stage').count(),0);
   // other games still open in the normal card
   await page.click('[data-game="mm"]');await page.waitForTimeout(400);assert.equal(await page.locator('.k-stage').count(),0);
   assert(await page.evaluate(()=>document.querySelector('#card').getBoundingClientRect().width<innerWidth),'memo game keeps its card');
   // reload: the game opens again with the saved stars
   await page.reload();await page.waitForFunction(()=>window.learningPath);
   await page.evaluate(()=>{curLevel='a11';setView('games');renderGamesHome()});await page.click('[data-game="kamer1"]');await page.waitForSelector('.k-menu');
   await page.click('.k-big');await page.waitForSelector('.k-stage .k-room');await page.evaluate(()=>document.querySelector('[data-item="bed"]').click());
   assert.match(await page.locator('.k-word-nl').textContent(),/het bed/);
   await ctx.close();
  }
  // 3. A2 room on a phone: stage, input task, keyboard-free layout
  {
   const {ctx,page}=await open(390,844,{level:'a21',game:'kamer',touch:true});
   await page.locator('.k-task').nth(1).click();await page.waitForSelector('.k-input');
   const m=await page.evaluate(measure);assert.equal(m.hscroll,false);assert(Math.max(m.room.w/m.scene.w,m.room.h/m.scene.h)>.7,'A2 room is big');
   assert.match(await page.locator('.k-chip-prog').textContent(),/2 \/ 5/);
   await ctx.close();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: full-screen room stage — '+report.join(', ')+'; zoom/wheel/drag limits/reset, wrong and right answers with score and voice, mute, full screen, menu/close, other games, reload, A2 on phone');
 }finally{await browser.close();server.close()}
})();
