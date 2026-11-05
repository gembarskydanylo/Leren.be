// Kamer van Pieter: REAL taps and clicks reach the objects in the 3D room. element.click() (used by the other kamer tests)
// skips hit-testing, so it never saw that the room's own 3D plane covered the bed, the wardrobe and the window for fingers.
// Here every object must take a tap on the visible centre of its faces, on a phone (touch) and on a desktop (mouse),
// at the starting view and after turning the camera, in the A1 and the A2 room, and a real finger tap on the bed shows its word.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/kamer-tap-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
// For each object: how many of its visible faces take a hit-test on the face (centre or one of four inner points) for this
// object. A chair leg in front of the backpack's centre is fine; the room's own plane in front of the whole bed is not.
const probe=()=>{const res={};for(const n of document.querySelectorAll('.k-room [data-item]')){let ok=0,all=0;
 for(const f of n.querySelectorAll('.k-face:not(.k-shadow),.k-bb')){const q=f.getBoundingClientRect();if(q.width<6||q.height<6)continue;
  const pts=[[.5,.5],[.3,.3],[.7,.3],[.3,.7],[.7,.7]].map(([a,b])=>[q.left+q.width*a,q.top+q.height*b]).filter(([x,y])=>x>=0&&y>=0&&x<=innerWidth&&y<=innerHeight);
  if(!pts.length)continue;all++;if(pts.some(([x,y])=>{const h=document.elementFromPoint(x,y);return h&&h.closest('[data-item]')===n}))ok++}
 res[n.dataset.item]={ok,all}}return res};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
 const errors=[],report=[];
 try{
  for(const [w,h,touch,level,game] of [[390,844,true,'a11','kamer1'],[412,915,true,'a11','kamer1'],[1536,960,false,'a11','kamer1'],[390,844,true,'a21','kamer']]){
   const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch,serviceWorkers:'block'}),page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(w+'x'+h+': '+e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
   await page.addInitScript(r=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.clear();localStorage.setItem('poly_ui','uk');localStorage.setItem('leren_release_seen',JSON.stringify(r))},release);
   await page.goto(base);await page.waitForFunction(()=>window.learningPath);
   await page.evaluate(l=>{curLevel=l;setView('games');renderGamesHome()},level);await page.click('[data-game="'+game+'"]');
   if(game==='kamer')await page.waitForSelector('.k-menu').then(()=>page.click('.k-big'));
   await page.waitForSelector('.k-stage .k-room');await page.waitForTimeout(900);
   await page.evaluate(()=>{window.__said=[];const o=window.say;window.say=(t,...a)=>{window.__said.push(t);return o&&o(t,...a)}});
   const views=[await page.evaluate(probe)];
   for(let i=0;i<2;i++){await page.evaluate(()=>{const s=document.querySelector('.k-scene');s.focus();s.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))});await page.waitForTimeout(700);views.push(await page.evaluate(probe))}
   for(const [vi,v] of views.entries())for(const [item,{ok,all}] of Object.entries(v)){
    assert(all>0,`${w}x${h} view ${vi}: ${item} has no visible face`);
    // A face may be hidden by something in front of it (the chair before the table), but most of each object must take taps.
    assert(ok>=Math.ceil(all*0.6),`${w}x${h} view ${vi}: ${item} takes a tap on only ${ok} of ${all} faces`)}
   if(level!=='a11'){report.push(`A2 room ${w}x${h}: bed ${views[0].bed.ok}/${views[0].bed.all}, wardrobe ${views[0].kast.ok}/${views[0].kast.all}`);await ctx.close();continue}
   // A real tap/click on the top of the bed shows its word (A1 room, free exploring).
   const top=await page.evaluate(()=>{let best=null;for(const f of document.querySelectorAll('[data-item="bed"] .k-face:not(.k-shadow)')){const q=f.getBoundingClientRect();const x=q.left+q.width/2,y=q.top+q.height/2,hit=document.elementFromPoint(x,y);if(hit&&hit.closest('[data-item="bed"]')&&(!best||q.width*q.height>best.a))best={x,y,a:q.width*q.height}}return best});
   assert(top,`${w}x${h}: no tappable bed face`);
   if(touch)await page.touchscreen.tap(top.x,top.y);else await page.mouse.click(top.x,top.y);
   // A1 room (no free exploring any more): the tapped object says its word.
   await page.waitForFunction(()=>window.__said.some(t=>/het bed/.test(t)),null,{timeout:3000});
   report.push(`${w}x${h} ${touch?'touch':'mouse'}: bed ${views[0].bed.ok}/${views[0].bed.all}, wardrobe ${views[0].kast.ok}/${views[0].kast.all}`);
   await ctx.close();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: real taps reach every room object — '+report.join('; '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
