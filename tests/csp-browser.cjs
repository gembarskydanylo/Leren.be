// The app runs under a strict Content-Security-Policy without 'unsafe-inline' for scripts (the policy we want in
// Cloudflare after v181): the server sends it on every response, and a walk through the main screens on a phone —
// route lesson, free practice, games (including the clock widget iframe and the diphthongs module), tests, exams,
// dictionary, progress, settings — must cause no CSP violation and no page error.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/csp-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.webmanifest':'application/manifest+json','.woff':'font/woff','.m4a':'audio/mp4'};
const CSP="default-src 'self'; script-src 'self' https://www.gstatic.com https://apis.google.com https://static.cloudflareinsights.com; connect-src 'self' https://*.googleapis.com https://leren-ai.gembarsky-d.workers.dev https://cloudflareinsights.com; frame-src 'self' https://leren-be.firebaseapp.com https://accounts.google.com; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'";
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream','content-security-policy':CSP});fs.createReadStream(f).pipe(res)});
const release=fs.readFileSync(path.join(root,'app.js'),'utf8').match(/const RELEASE_VERSION="(\d+)"/)[1];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/index.html';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[],violations=[];
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());page.on('dialog',d=>d.dismiss());
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('CSPV '))violations.push(m.text())});
  await page.addInitScript(r=>{addEventListener('securitypolicyviolation',e=>console.error('CSPV '+e.effectiveDirective+' '+e.blockedURI+' '+e.sourceFile+':'+e.lineNumber),true);
   if(window===top&&!sessionStorage.getItem('seeded')){localStorage.clear();localStorage.setItem('leren_release_seen',JSON.stringify(r));localStorage.setItem('poly_ui','uk');localStorage.setItem('leren_home_v1','path');sessionStorage.setItem('seeded','1')}},release);
  await page.goto(base);await page.waitForFunction(()=>window.learningPath&&window.EXAM12);
  assert(await page.evaluate(()=>{const s=document.querySelector('.seo-shell');return !s||getComputedStyle(s).display==='none'}),'static summary hidden when JavaScript runs');
  const steps=[];const S=async(name,fn,wait=250)=>{await page.evaluate(fn).catch(e=>errors.push(name+': '+e.message));await page.waitForTimeout(wait);steps.push(name)};
  await S('home',()=>setView('path'));
  await S('lesson',()=>{const m=learningPath.model;m.begin(m.recommended().id);learningPath.open();document.querySelector('#learningPath .fh-primary')?.click()});
  await S('study',()=>document.querySelector('#learningPath .lp-card .lp-primary')?.click());
  await S('free-quiz',()=>{setHomePref('free');lessonMode='quiz';mode='quiz';setView('lesson');newRound()});
  for(const m of ['audio','build','review'])await S('free-'+m,new Function(`lessonMode='${m}';mode='${m}';newRound()`));
  for(const g of ['dlg','rp','sp','bl','mm','dc','md','om','ks','wb','story'])await S('game-'+g,new Function(`setView('games');document.querySelector('[data-game="${g}"]')?.click()`));
  await S('clock',()=>{setView('lesson');showInteractiveClock()},1200);
  const frame=page.frames().find(f=>f.url().includes('clock/widget.html'));
  if(frame){await frame.evaluate(()=>document.querySelector('[data-call="clockSetMode"][data-arg="quiz"]').click());await page.waitForTimeout(150);assert.equal(await frame.evaluate(()=>document.getElementById('clockQuizPanel').hidden),false,'clock buttons work without inline onclick');steps.push('clock-buttons')}
  await S('toets',()=>setView('toets'));
  await S('exam12',()=>{switchCourse('a12');setView('toets');document.getElementById('examPick')?.click()});
  await S('exam-luisteren',()=>EXAM12._quiz('luisteren',true));
  await S('dict',()=>{switchCourse('a11');setView('dict')});
  await S('progress',()=>setView('progress'));
  await S('settings',()=>openSheet('settingsSheet'));
  await S('diphthongs',()=>{closeSheet('settingsSheet');if(window.LerenDiphthongs&&LerenDiphthongs.open)LerenDiphthongs.open()},500);
  assert.deepEqual(violations,[],'CSP violations');assert.deepEqual(errors,[],'page errors');
  console.log('PASS: strict CSP without unsafe-inline — '+steps.length+' screens ('+steps.join(', ')+'), no violations, no page errors');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
