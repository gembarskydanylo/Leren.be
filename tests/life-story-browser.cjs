// LerenBe LIFE story «Перший день у Бельгії» on a phone (learn-life-story.html): the whole story in 📖 learn mode with
// mistakes, a «repeat» request (slow repeat, no penalty), finding objects, speaking by word tiles (no microphone in the
// test browser); XP shown and recorded; the app then adds the story XP to the shared XP once (also after a reload);
// 🎭 real-life mode hides the text and translations. Needs Playwright with Chromium. Run: node tests/life-story-browser.cjs
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff':'font/woff','.webmanifest':'application/json','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
const release=require(__dirname+'/lib/app-source.cjs')().match(/const RELEASE_VERSION="(\d+)"/)[1];
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const report=[];
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  // Speech recognition mock: hears window.__heard (Chrome's real recogniser needs a microphone and Google servers).
  await page.addInitScript(()=>{class R{start(){setTimeout(()=>{const t=window.__heard||'';if(t)this.onresult?.({results:[[{transcript:t}]]});this.onend?.()},50)}}window.webkitSpeechRecognition=R;window.SpeechRecognition=R});
  await page.goto(base+'learn-life-story.html?s=first-day');await page.waitForSelector('.ls-hero h1');
  assert.match(await page.locator('.ls-hero h1').textContent(),/Перший день у Бельгії/);assert.equal(await page.locator('.ls-scenes li').count(),6);
  assert.equal(await page.locator('.ls-road-list li').count(),15,'roadmap of 15 stories');
  const S=await page.evaluate(()=>import('./modules/learn-life/stories/first-day.mjs').then(m=>JSON.parse(JSON.stringify(m.firstDay))));
  await page.click('.ls-hero .ls-primary');let repeated=false,said=false,mistakes=0,guard=0;
  while(guard++<300){
   if(await page.locator('.ls-end').count()){const next=page.locator('.ls-end .ls-primary');if(await next.count()){await next.click();continue}break}
   const type=await page.locator('#app').getAttribute('data-step');const sid=await page.locator('#app').getAttribute('data-scene'),sc=S.scenes.find(x=>x.id===sid);
   const idx=Number((await page.locator('.ls-step-n').textContent()).split(' / ')[0])-1,step=sc.steps[idx];
   if(await page.locator('.ls-panel > .ls-primary',{hasText:'Далі'}).count()&&type!=='reply'&&(type==='line'||await page.locator('.ls-feedback.is-ok').count())){await page.locator('.ls-panel > .ls-primary',{hasText:'Далі'}).click();continue}
   if(type==='reply'){
    if(!repeated){const rep=step.options.findIndex(o=>o.repeat);await page.click(`.ls-option[data-option="${rep}"]`);repeated=true;assert(await page.locator('.ls-bubble.is-slow').count(),'character repeats slowly');assert.match(await page.locator('.ls-feedback').first().textContent(),/перепитав/);continue}
    if(mistakes<2){const bad=step.options.findIndex(o=>!o.ok&&!o.repeat);await page.click(`.ls-option[data-option="${bad}"]`);assert.equal(await page.locator('.ls-feedback.is-no').count(),1,'wrong reply explained');mistakes++}
    await page.click(`.ls-option[data-option="${step.options.findIndex(o=>o.ok)}"]`);continue}
   if(type==='listen'){await page.click(`.ls-option[data-option="${step.answer}"]`);continue}
   if(type==='find'){const asked=await page.locator('.ls-bubble').last().locator('.ls-nl').textContent();const it=step.items.find(i=>asked.includes(i.nl));await page.click(`.ls-item[data-item="${it.id}"]`);await page.waitForTimeout(500);continue}
   if(type==='say'){
    if(!said){said=true;await page.evaluate(()=>{window.__heard='ik ben moe'});await page.click('.ls-mic');await page.waitForSelector('.ls-feedback.is-no');
     await page.evaluate(t=>{window.__heard=t.toLowerCase().replace(/[.!,]/g,'')},step.nl);await page.click('.ls-mic');await page.waitForSelector('.ls-feedback.is-ok');continue}
    await page.locator('.ls-btn',{hasText:'Скласти зі слів'}).click();
    for(const w of step.nl.split(' '))await page.locator('.ls-tile:not([disabled])',{hasText:w}).first().click();await page.waitForSelector('.ls-feedback.is-ok');continue}
   throw Error('stuck at '+type)}
  assert(guard<300);assert.match(await page.locator('.ls-finale').textContent(),/пройдено/);
  const rec=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_life_xp_v1')));const xp=Object.values(rec).reduce((a,b)=>a+b,0);
  assert.equal(Object.keys(rec).length,6,'XP for every scene');assert(xp>0&&xp<85,'two first-try mistakes cost points: '+xp);
  if(process.env.SHOTS)await page.screenshot({path:path.join(process.env.SHOTS,'life-end.png')});
  report.push(`whole story on a phone: repeat without penalty, ${mistakes} mistakes explained, speaking by microphone (wrong, then right) and by tiles, ${xp} XP`);
  // real-life mode: hidden text and no translations
  await page.locator('.ls-mode [data-mode="real"]').click();await page.locator('.ls-btn',{hasText:'До всіх сцен'}).click();await page.click('.ls-scenes li[data-scene="station"] .ls-scene');
  assert.equal(await page.locator('.ls-nl.is-hidden').count(),1,'text hidden in real life');assert.equal(await page.locator('.ls-uk').count(),0,'no translation');
  await page.locator('.ls-reveal').click();assert.equal(await page.locator('.ls-nl.is-hidden').count(),0,'text on request');
  await page.locator('.ls-panel .ls-primary').click();assert.equal(await page.locator('.ls-opt-uk').count(),0,'replies without translation');
  report.push('real-life mode: text on request, no translations');
  // the app adds the story XP once
  await page.addInitScript(r=>{try{localStorage.setItem('leren_release_seen',JSON.stringify(r));localStorage.setItem('leren_welcome_seen','true');localStorage.setItem('poly_ui','uk')}catch(e){}},release);
  const before=await page.evaluate(()=>Number(localStorage.getItem('poly_score')||0));
  await page.goto(base+'index.html');await page.waitForFunction(()=>typeof absorbLifeXP==='function');
  const after=await page.evaluate(()=>({score:Number(localStorage.getItem('poly_score')||0),g:JSON.parse(localStorage.getItem('leren_xp_v2')).g}));
  assert.equal(after.score-before,xp,'story XP added to the shared XP');assert.equal(after.g['l:first-day:station'],rec['first-day:station']);
  await page.reload();await page.waitForFunction(()=>typeof absorbLifeXP==='function');assert.equal(await page.evaluate(()=>absorbLifeXP()),0,'never twice');
  assert.equal(await page.evaluate(()=>Number(localStorage.getItem('poly_score'))),after.score);
  report.push('app: +'+xp+' XP once');
  assert.deepEqual(errors,[]);await ctx.close();
  console.log('PASS: LIFE «Перший день у Бельгії» — '+report.join('; '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
