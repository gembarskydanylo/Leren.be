// LerenBe 3.0 quality audit · LIFE: a double tap counts once. The reply options and «Далі →» re-render the step at once, so the
// second tap of a double tap landed on the NEXT step's button in the same place: it skipped a dialogue line or answered the next
// question for the learner (and spoilt its first-try XP). Each double tap must move exactly one step. Chromium, phone size.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{console.log('SKIP: Playwright is not installed');process.exit(0)}
const root=path.join(__dirname,'..'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));if(!file.startsWith(root)||!fs.existsSync(file)){res.statusCode=404;return res.end()}if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 let browser;try{browser=await chromium.launch()}catch{console.log('SKIP: no Chromium');server.close();return}
 const bad=[];let taps=0;
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  await page.goto(base+'learn-life-story.html?s=first-day');await page.waitForSelector('.ls-hero h1');
  const S=await page.evaluate(()=>import('./modules/learn-life/stories/first-day.mjs').then(m=>JSON.parse(JSON.stringify(m.firstDay))));
  await page.click('.ls-hero .ls-primary');
  const where=()=>page.evaluate(()=>{const a=document.getElementById('app');return {sid:a.dataset.scene,i:Number(a.dataset.index),type:a.dataset.step}});
  const dbl=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();await page.waitForTimeout(400);const b=await l.boundingBox();await page.mouse.dblclick(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(150)};
  for(let n=0;n<14;n++){
   const w=await where();if(!w.sid)break;if(await page.locator('.ls-end').count()){const nx=page.locator('.ls-end button.ls-primary');if(!await nx.count())break;await nx.click();await page.waitForTimeout(200);continue}const step=S.scenes.find(x=>x.id===w.sid).steps[w.i];
   if(w.type==='line'){await dbl('.ls-panel > .ls-primary');taps++;const a=await where();if(a.sid===w.sid&&a.i!==w.i+1)bad.push(`line ${w.sid}#${w.i}: a double tap on «Далі» moved to #${a.i}`);continue}
   if(w.type==='reply'){const pick=step.options.findIndex(o=>o.ok);await dbl(`.ls-option[data-option="${pick}"]`);taps++;const a=await where();
    const jump=step.options[pick].goto?S.scenes.find(x=>x.id===w.sid).steps.findIndex(x=>x.id===step.options[pick].goto):-1,want=jump>=0?jump:w.i+1;
    const ended=await page.locator('.ls-end').count()&&want>=S.scenes.find(x=>x.id===w.sid).steps.length;if(!ended&&a.sid===w.sid&&a.i!==want)bad.push(`reply ${w.sid}#${w.i}: a double tap on the right answer moved to #${a.i} (expected #${want})`);
    if(await page.locator('.ls-option.is-wrong').count())bad.push(`reply ${w.sid}#${w.i}: the second tap answered the next question`);continue}
   if(w.type==='listen'){await page.click(`.ls-option[data-option="${step.answer}"]`);await page.click('.ls-panel > .ls-primary');continue}
   break}
  if(errors.length)bad.push('page errors: '+errors.join(' / ').slice(0,200));
  await ctx.close();
 }finally{await browser.close();server.close()}
 if(bad.length){console.log(bad.join('\n'));assert.fail(bad.length+' problem(s)')}
 assert.ok(taps>=4,'the story was walked with double taps ('+taps+')');
 console.log('PASS: LIFE double taps — '+taps+' double taps on «Далі» and on right replies each moved exactly one step; the next question was never answered by the second tap');
})().catch(e=>{console.error(e.message);process.exit(1)});
