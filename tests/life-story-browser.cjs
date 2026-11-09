// LerenBe LIFE story «Перший день у Бельгії» on a phone (learn-life-story.html, Engine 2.0): the whole story in
// 🟢 beginner mode taking the «no ticket» branch (extra scene at the ticket machine) with a «repeat» request (slow
// repeat + explanation, no penalty), explained mistakes, the character's reaction, finding objects, speaking by
// microphone (mocked recogniser: wrong order → grammar hint, then right) and by word tiles; the skills card; XP
// recorded and added by the app once; Annick and Jan remembered; 🟡 practice and 🔴 real-life modes.
// Needs Playwright with Chromium; skipped otherwise. Run: node tests/life-story-browser.cjs
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
  assert.match(await page.locator('.ls-hero h1').textContent(),/Перший день у Бельгії/);assert.equal(await page.locator('.ls-mode button').count(),3,'three help levels');
  assert.equal(await page.locator('.ls-scenes li').count(),6,'the machine scene is hidden until the learner chooses it');assert.equal(await page.locator('.ls-road-list li').count(),15);
  const S=await page.evaluate(()=>import('./modules/learn-life/stories/first-day.mjs').then(m=>JSON.parse(JSON.stringify(m.firstDay))));
  await page.click('.ls-hero .ls-primary');let repeated=false,said=false,mistakes=0,reacted=false,guard=0;
  while(guard++<400){
   if(await page.locator('.ls-end').count()){const next=page.locator('.ls-end button.ls-primary');if(await next.count()){await next.click();continue}break}
   const type=await page.locator('#app').getAttribute('data-step'),sid=await page.locator('#app').getAttribute('data-scene'),idx=Number(await page.locator('#app').getAttribute('data-index')),step=S.scenes.find(x=>x.id===sid).steps[idx];
   const nextBtn=page.locator('.ls-panel > .ls-primary',{hasText:'Далі'});
   if(type==='line'||(await nextBtn.count()&&await page.locator('.ls-feedback.is-ok').count()&&type!=='reply')){await nextBtn.click();continue}
   if(type==='reply'){
    if(!repeated){await page.click(`.ls-option[data-option="${step.options.findIndex(o=>o.repeat)}"]`);repeated=true;assert(await page.locator('.ls-bubble.is-slow').count(),'character repeats slowly');assert.match(await page.locator('.ls-feedback').first().textContent(),/перепитав/);continue}
    if(mistakes<2){await page.click(`.ls-option[data-option="${step.options.findIndex(o=>!o.ok&&!o.repeat)}"]`);assert.equal(await page.locator('.ls-feedback.is-no').count(),1,'wrong reply explained');mistakes++}
    let pick=step.options.findIndex(o=>o.set?.ticket==='buy');if(pick<0)pick=step.options.findIndex(o=>o.ok);
    if(step.explain){await page.click(`.ls-option[data-option="${step.options.findIndex(o=>o.repeat)}"]`);assert.match(await page.locator('.ls-feedback').first().textContent(),/квиток/,'the word ticket is explained')}
    const bubbles=await page.locator('.ls-bubble').count();await page.click(`.ls-option[data-option="${pick}"]`);
    if(step.options[pick].react){await page.waitForFunction(n=>document.querySelectorAll('.ls-bubble').length>=n+2,bubbles);reacted=true}
    continue}
   if(type==='listen'){await page.click(`.ls-option[data-option="${step.answer}"]`);continue}
   if(type==='find'){const asked=await page.locator('.ls-bubble').last().locator('.ls-nl').textContent();const it=step.items.find(i=>asked.includes(i.nl));await page.click(`.ls-item[data-item="${it.id}"]`);await page.waitForTimeout(500);continue}
   if(type==='say'){
    if(!said){said=true;await page.evaluate(t=>{window.__heard=t.toLowerCase().replace(/[.!,]/g,'').split(' ').reverse().join(' ')},step.nl);await page.click('.ls-mic');await page.waitForSelector('.ls-feedback.is-no');
     assert.match(await page.locator('.ls-feedback.is-no').textContent(),/порядок/,'right words, wrong order → grammar hint');
     await page.evaluate(t=>{window.__heard=t.toLowerCase().replace(/[.!,]/g,'')},step.nl);await page.click('.ls-mic');await page.waitForSelector('.ls-feedback.is-ok');continue}
    await page.locator('.ls-btn',{hasText:'Скласти зі слів'}).click();
    for(const w of step.nl.split(' '))await page.locator('.ls-tile:not([disabled])',{hasText:w}).first().click();await page.waitForSelector('.ls-feedback.is-ok');continue}
   throw Error('stuck at '+type)}
  assert(guard<400);assert.match(await page.locator('.ls-finale').textContent(),/пройдено/);assert(reacted,'characters react to the choice');
  assert.equal(await page.locator('.ls-end .ls-skill').count()>0,true,'skills card at the end of a scene');
  const rec=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_life_xp_v1')));const xp=Object.values(rec).reduce((a,b)=>a+b,0);
  assert.equal(Object.keys(rec).length,7,'XP for every scene incl. the machine');assert(rec['first-day:machine']>0);assert(xp>0&&xp<105,'mistakes cost first-try points: '+xp);
  const mem=await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_life_memory_v1')));assert.deepEqual(mem.met,{annick:true,jan:true});assert.equal(mem.flags['first-day.ticket'],'buy');
  report.push(`whole story, «no ticket» branch (+machine scene), repeat with explanation, ${mistakes} mistakes explained, reactions, microphone (word order) and tiles, ${xp} XP`);
  // home: people remembered, skills, 7 scenes
  await page.locator('.ls-btn',{hasText:'До всіх сцен'}).click();assert.equal(await page.locator('.ls-scenes li').count(),7);
  assert.match(await page.locator('.ls-person[data-person="jan"]').textContent(),/вже знайомі/);assert.equal(await page.locator('.ls-skills .ls-skill').count(),3,'understanding, grammar, speaking');
  if(process.env.SHOTS)await page.screenshot({path:path.join(process.env.SHOTS,'life2-home.png'),fullPage:true});
  // 🟡 practice: Dutch text, translation on request, replies without translation
  await page.locator('.ls-mode [data-mode="practice"]').click();await page.click('.ls-scenes li[data-scene="station"] .ls-scene');
  assert.equal(await page.locator('.ls-uk').count(),0);await page.locator('.ls-translate').first().click();assert.equal(await page.locator('.ls-uk').count(),1,'translation on request');
  await page.locator('.ls-panel .ls-primary').click();assert.equal(await page.locator('.ls-opt-uk').count(),0,'replies without translation');
  // 🔴 real: hidden text, no translation button
  await page.locator('.ls-mode [data-mode="real"]').click();await page.locator('.ls-scene-head .ls-icon').click();await page.click('.ls-scenes li[data-scene="station"] .ls-scene');
  assert.equal(await page.locator('.ls-nl.is-hidden').count(),1);assert.equal(await page.locator('.ls-translate').count(),0);await page.locator('.ls-reveal').click();assert.equal(await page.locator('.ls-nl.is-hidden').count(),0);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_life_story_v1_first-day')).mode),'real','mode saved, progress kept');
  assert.equal(Object.values(await page.evaluate(()=>JSON.parse(localStorage.getItem('leren_life_xp_v1')))).reduce((a,b)=>a+b,0),xp);
  report.push('practice: translation on request; real life: hidden text; switching keeps progress');
  // the app adds the story XP once
  await page.addInitScript(r=>{try{localStorage.setItem('leren_release_seen',JSON.stringify(r));localStorage.setItem('leren_welcome_seen','true');localStorage.setItem('poly_ui','uk')}catch(e){}},release);
  const before=await page.evaluate(()=>Number(localStorage.getItem('poly_score')||0));
  await page.goto(base+'index.html');await page.waitForFunction(()=>typeof absorbLifeXP==='function');
  const after=await page.evaluate(()=>({score:Number(localStorage.getItem('poly_score')||0),g:JSON.parse(localStorage.getItem('leren_xp_v2')).g}));
  assert.equal(after.score-before,xp,'story XP added to the shared XP');assert.equal(after.g['l:first-day:machine'],rec['first-day:machine']);
  await page.reload();await page.waitForFunction(()=>typeof absorbLifeXP==='function');assert.equal(await page.evaluate(()=>absorbLifeXP()),0,'never twice');
  report.push('app: +'+xp+' XP once');
  assert.deepEqual(errors,[]);await ctx.close();
  console.log('PASS: LIFE «Перший день у Бельгії» (Engine 2.0) — '+report.join('; '));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
